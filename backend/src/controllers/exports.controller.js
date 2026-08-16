const pool = require('../config/db');
const { asyncHandler } = require('../utils/helpers');
const { buildXlsx, buildPdf } = require('../services/exporter');

const num = (v) => parseFloat(v) || 0;

/* Period helper (sama seperti reports.controller) */
function getRange(req) {
  const { period, from, to } = req.query;
  const now = new Date();
  const d = (dt) => dt.toISOString().slice(0, 10);
  let start = from;
  let end = to;
  if (period === 'today') { start = d(now); end = d(now); }
  if (period === 'yesterday') { const y = new Date(now); y.setDate(y.getDate() - 1); start = d(y); end = d(y); }
  if (period === 'this_week') { const day = (now.getDay() + 6) % 7; const s = new Date(now); s.setDate(now.getDate() - day); start = d(s); end = d(now); }
  if (period === 'this_month') { start = d(new Date(now.getFullYear(), now.getMonth(), 1)); end = d(now); }
  if (period === 'this_year') { start = d(new Date(now.getFullYear(), 0, 1)); end = d(now); }
  if (!start || !end) { start = d(now); end = d(now); }
  return { start, end };
}

function branchWhere(req, alias, params) {
  const bid = req.query.branch_id || req.user.branch_id;
  if (bid) { params.push(bid); return `${alias}.branch_id = ?`; }
  return '1=1';
}

const METHOD_LABEL = { cash: 'Tunai', transfer: 'Transfer', qris: 'QRIS', debt: 'Hutang', mixed: 'Campuran' };
const TYPE_LABEL = { sale: 'Penjualan', purchase: 'Pembelian', in: 'Pemasukan', out: 'Pengeluaran', tarik: 'Tarik Kas', setor: 'Setor Bank', debt_payment: 'Bayar Hutang', receivable_payment: 'Terima Piutang', open_balance: 'Saldo Awal' };

/* GET /api/export/report?type=sales&format=xlsx|pdf&period=...&breakdown=... */
exports.report = asyncHandler(async (req, res) => {
  const { type, format } = req.query;
  if (!['sales', 'purchases', 'cash', 'stock', 'debts'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Tipe laporan tidak valid' });
  }
  if (!['xlsx', 'pdf'].includes(format)) {
    return res.status(400).json({ success: false, message: 'Format harus xlsx atau pdf' });
  }
  const { start, end } = getRange(req);
  const params = [`${start} 00:00:00`, `${end} 23:59:59`];
  const bid = req.query.branch_id || req.user.branch_id;
  const branchName = req.user.branch_name || 'Semua Cabang';

  let title = '';
  let columns = [];
  let rows = [];
  let summary = [];

  if (type === 'sales') {
    const { breakdown } = req.query;
    const branchSql = branchWhere(req, 's', params);
    const [[sum]] = await pool.query(
      `SELECT IFNULL(SUM(s.total),0) AS omzet, COUNT(*) AS transaksi, IFNULL(SUM(s.debt_amount),0) AS piutang,
              IFNULL(AVG(s.total),0) AS rata_rata, IFNULL(SUM(s.total - s.tax),0) AS gross
       FROM sales s WHERE s.status = 'completed' AND s.created_at BETWEEN ? AND ? AND ${branchSql}`, params);
    title = 'Laporan Penjualan';
    columns = [
      { header: 'Tanggal', key: 'date', width: 16, type: 'string' },
      { header: 'Transaksi', key: 'transaksi', width: 14, type: 'number' },
      { header: 'Total', key: 'total', width: 20, type: 'number' },
    ];
    if (breakdown === 'cashier') {
      columns = [
        { header: 'Kasir', key: 'name', width: 24 },
        { header: 'Transaksi', key: 'transaksi', width: 14, type: 'number' },
        { header: 'Total', key: 'total', width: 20, type: 'number' },
      ];
      [rows] = await pool.query(
        `SELECT u.full_name AS name, COUNT(*) AS transaksi, IFNULL(SUM(s.total),0) AS total
         FROM sales s JOIN users u ON u.id = s.user_id
         WHERE s.status = 'completed' AND s.created_at BETWEEN ? AND ? AND ${branchSql}
         GROUP BY u.id, u.full_name ORDER BY total DESC`, params);
    } else if (breakdown === 'product') {
      columns = [
        { header: 'Produk', key: 'name', width: 30 },
        { header: 'Qty', key: 'qty', width: 12, type: 'number' },
        { header: 'Total', key: 'total', width: 20, type: 'number' },
      ];
      [rows] = await pool.query(
        `SELECT p.name, IFNULL(SUM(si.qty),0) AS qty, IFNULL(SUM(si.subtotal),0) AS total
         FROM sale_items si JOIN products p ON p.id = si.product_id JOIN sales s ON s.id = si.sale_id
         WHERE s.status = 'completed' AND s.created_at BETWEEN ? AND ? AND ${branchSql} AND si.is_free = 0
         GROUP BY p.id, p.name ORDER BY total DESC LIMIT 100`, params);
    } else if (breakdown === 'category') {
      columns = [
        { header: 'Kategori', key: 'name', width: 24 },
        { header: 'Total', key: 'total', width: 20, type: 'number' },
      ];
      [rows] = await pool.query(
        `SELECT IFNULL(c.name, 'Tanpa Kategori') AS name, IFNULL(SUM(si.subtotal),0) AS total
         FROM sale_items si JOIN products p ON p.id = si.product_id JOIN sales s ON s.id = si.sale_id
         LEFT JOIN categories c ON c.id = p.category_id
         WHERE s.status = 'completed' AND s.created_at BETWEEN ? AND ? AND ${branchSql} AND si.is_free = 0
         GROUP BY c.id, c.name ORDER BY total DESC`, params);
    } else if (breakdown === 'customer') {
      columns = [
        { header: 'Pelanggan', key: 'name', width: 24 },
        { header: 'Transaksi', key: 'transaksi', width: 14, type: 'number' },
        { header: 'Total', key: 'total', width: 20, type: 'number' },
      ];
      [rows] = await pool.query(
        `SELECT IFNULL(s.customer_name, 'Umum') AS name, COUNT(*) AS transaksi, IFNULL(SUM(s.total),0) AS total
         FROM sales s WHERE s.status = 'completed' AND s.created_at BETWEEN ? AND ? AND ${branchSql}
         GROUP BY s.customer_id, s.customer_name ORDER BY total DESC LIMIT 50`, params);
    } else if (breakdown === 'method') {
      columns = [
        { header: 'Metode', key: 'name', width: 16 },
        { header: 'Transaksi', key: 'transaksi', width: 14, type: 'number' },
        { header: 'Total', key: 'total', width: 20, type: 'number' },
      ];
      const [mrows] = await pool.query(
        `SELECT s.payment_method, COUNT(*) AS transaksi, IFNULL(SUM(s.total),0) AS total
         FROM sales s WHERE s.status = 'completed' AND s.created_at BETWEEN ? AND ? AND ${branchSql}
         GROUP BY s.payment_method ORDER BY total DESC`, params);
      rows = mrows.map((r) => ({ ...r, name: METHOD_LABEL[r.payment_method] || r.payment_method }));
    } else if (breakdown === 'branch') {
      columns = [
        { header: 'Cabang', key: 'name', width: 24 },
        { header: 'Transaksi', key: 'transaksi', width: 14, type: 'number' },
        { header: 'Total', key: 'total', width: 20, type: 'number' },
      ];
      [rows] = await pool.query(
        `SELECT b.name, COUNT(*) AS transaksi, IFNULL(SUM(s.total),0) AS total
         FROM sales s JOIN branches b ON b.id = s.branch_id
         WHERE s.status = 'completed' AND s.created_at BETWEEN ? AND ? AND s.branch_id IS NOT NULL
         GROUP BY b.id, b.name ORDER BY total DESC`, [params[0], params[1]]);
    } else {
      [rows] = await pool.query(
        `SELECT DATE(s.created_at) AS date, COUNT(*) AS transaksi, IFNULL(SUM(s.total),0) AS total
         FROM sales s WHERE s.status = 'completed' AND s.created_at BETWEEN ? AND ? AND ${branchSql}
         GROUP BY DATE(s.created_at) ORDER BY date`, params);
    }
    summary = [
      { label: 'Periode', value: `${start} s/d ${end}` },
      { label: 'Cabang', value: branchName },
      { label: 'Omzet', value: `Rp ${Number(sum.omzet).toLocaleString('id-ID')}` },
      { label: 'Transaksi', value: String(sum.transaksi) },
      { label: 'Rata-rata', value: `Rp ${Number(sum.rata_rata).toLocaleString('id-ID')}` },
    ];
  } else if (type === 'purchases') {
    const { breakdown } = req.query;
    const branchSql = branchWhere(req, 'p', params);
    const [[sum]] = await pool.query(
      `SELECT IFNULL(SUM(p.total),0) AS total, COUNT(*) AS transaksi FROM purchases p
       WHERE p.created_at BETWEEN ? AND ? AND ${branchSql}`, params);
    title = 'Laporan Pembelian';
    columns = [
      { header: 'Tanggal', key: 'date', width: 16 },
      { header: 'Transaksi', key: 'transaksi', width: 14, type: 'number' },
      { header: 'Total', key: 'total', width: 20, type: 'number' },
    ];
    if (breakdown === 'supplier') {
      columns = [
        { header: 'Supplier', key: 'name', width: 24 },
        { header: 'Transaksi', key: 'transaksi', width: 14, type: 'number' },
        { header: 'Total', key: 'total', width: 20, type: 'number' },
      ];
      [rows] = await pool.query(
        `SELECT s.name, COUNT(*) AS transaksi, IFNULL(SUM(p.total),0) AS total
         FROM purchases p JOIN suppliers s ON s.id = p.supplier_id
         WHERE p.created_at BETWEEN ? AND ? AND ${branchSql}
         GROUP BY s.id, s.name ORDER BY total DESC`, params);
    } else if (breakdown === 'product') {
      columns = [
        { header: 'Produk', key: 'name', width: 30 },
        { header: 'Qty', key: 'qty', width: 12, type: 'number' },
        { header: 'Total', key: 'total', width: 20, type: 'number' },
      ];
      [rows] = await pool.query(
        `SELECT prd.name, IFNULL(SUM(pi.qty),0) AS qty, IFNULL(SUM(pi.subtotal),0) AS total
         FROM purchase_items pi JOIN products prd ON prd.id = pi.product_id JOIN purchases p ON p.id = pi.purchase_id
         WHERE p.created_at BETWEEN ? AND ? AND ${branchSql}
         GROUP BY prd.id, prd.name ORDER BY total DESC LIMIT 100`, params);
    } else if (breakdown === 'branch') {
      columns = [
        { header: 'Cabang', key: 'name', width: 24 },
        { header: 'Transaksi', key: 'transaksi', width: 14, type: 'number' },
        { header: 'Total', key: 'total', width: 20, type: 'number' },
      ];
      [rows] = await pool.query(
        `SELECT b.name, COUNT(*) AS transaksi, IFNULL(SUM(p.total),0) AS total
         FROM purchases p JOIN branches b ON b.id = p.branch_id
         WHERE p.created_at BETWEEN ? AND ? AND p.branch_id IS NOT NULL
         GROUP BY b.id, b.name ORDER BY total DESC`, [params[0], params[1]]);
    } else {
      [rows] = await pool.query(
        `SELECT DATE(p.created_at) AS date, COUNT(*) AS transaksi, IFNULL(SUM(p.total),0) AS total
         FROM purchases p WHERE p.created_at BETWEEN ? AND ? AND ${branchSql}
         GROUP BY DATE(p.created_at) ORDER BY date`, params);
    }
    summary = [
      { label: 'Periode', value: `${start} s/d ${end}` },
      { label: 'Total Pembelian', value: `Rp ${Number(sum.total).toLocaleString('id-ID')}` },
      { label: 'Transaksi', value: String(sum.transaksi) },
    ];
  } else if (type === 'cash') {
    const branchSql = branchWhere(req, 'ct', params);
    const [cashRows] = await pool.query(
      `SELECT ct.type, COUNT(*) AS jumlah, IFNULL(SUM(ct.amount),0) AS total
       FROM cash_transactions ct WHERE ct.created_at BETWEEN ? AND ? AND ${branchSql}
       GROUP BY ct.type ORDER BY ct.type`, params);
    title = 'Laporan Kas';
    columns = [
      { header: 'Jenis', key: 'name', width: 24 },
      { header: 'Jumlah', key: 'jumlah', width: 12, type: 'number' },
      { header: 'Total', key: 'total', width: 20, type: 'number' },
    ];
    rows = cashRows.map((r) => ({ ...r, name: TYPE_LABEL[r.type] || r.type }));
    const [[balance]] = await pool.query(
      `SELECT IFNULL(SUM(CASE WHEN type IN ('sale','in','tarik','debt_payment','receivable_payment','open_balance') THEN amount
                             WHEN type IN ('out','setor','purchase') THEN -amount ELSE 0 END),0) AS saldo
       FROM cash_transactions ct WHERE ct.created_at BETWEEN ? AND ? AND ${branchSql}`, params);
    summary = [
      { label: 'Periode', value: `${start} s/d ${end}` },
      { label: 'Saldo', value: `Rp ${Number(balance.saldo).toLocaleString('id-ID')}` },
    ];
  } else if (type === 'stock') {
    const { view } = req.query;
    const bidSql = bid ? 'AND ps.branch_id = ?' : '';
    const bidParams = bid ? [bid] : [];
    title = 'Laporan Stok';
    if (view === 'low') {
      columns = [
        { header: 'Kode', key: 'code', width: 14 },
        { header: 'Produk', key: 'name', width: 30 },
        { header: 'Stok', key: 'stock_qty', width: 12, type: 'number' },
        { header: 'Min Stok', key: 'min_stock', width: 12, type: 'number' },
        { header: 'Cabang', key: 'branch_name', width: 20 },
      ];
      [rows] = await pool.query(
        `SELECT p.code, p.name, ps.qty AS stock_qty, p.min_stock, b.name AS branch_name
         FROM product_stocks ps JOIN products p ON p.id = ps.product_id JOIN branches b ON b.id = ps.branch_id
         WHERE p.is_active = 1 AND ps.qty <= p.min_stock ${bidSql}
         ORDER BY (ps.qty - p.min_stock) ASC`, bidParams);
    } else {
      columns = [
        { header: 'Kode', key: 'code', width: 14 },
        { header: 'Produk', key: 'name', width: 30 },
        { header: 'Kategori', key: 'category_name', width: 20 },
        { header: 'Stok', key: 'stock_qty', width: 12, type: 'number' },
        { header: 'Harga Beli', key: 'buy_price', width: 18, type: 'number' },
        { header: 'Harga Jual', key: 'retail_price', width: 18, type: 'number' },
        { header: 'Cabang', key: 'branch_name', width: 20 },
      ];
      [rows] = await pool.query(
        `SELECT p.code, p.name, IFNULL(c.name, '-') AS category_name, ps.qty AS stock_qty,
                p.buy_price, p.retail_price, b.name AS branch_name
         FROM product_stocks ps JOIN products p ON p.id = ps.product_id
         LEFT JOIN categories c ON c.id = p.category_id
         JOIN branches b ON b.id = ps.branch_id
         WHERE p.is_active = 1 ${bidSql}
         ORDER BY p.name`, bidParams);
    }
  } else if (type === 'debts') {
    const { view } = req.query;
    const bidSql = bid ? 'AND d.branch_id = ?' : '';
    const bidParams = bid ? [bid] : [];
    if (view === 'piutang') {
      title = 'Laporan Piutang';
      columns = [
        { header: 'Pelanggan', key: 'customer_name', width: 24 },
        { header: 'Invoice', key: 'invoice_no', width: 20 },
        { header: 'Sisa', key: 'sisa', width: 20, type: 'number' },
        { header: 'Jatuh Tempo', key: 'due_date', width: 16 },
        { header: 'Umur (hari)', key: 'umur_hari', width: 12, type: 'number' },
      ];
      const [drows] = await pool.query(
        `SELECT c.name AS customer_name, s.invoice_no, (d.amount - d.paid_amount) AS sisa,
                d.due_date, DATEDIFF(CURDATE(), d.due_date) AS umur_hari
         FROM receivables d JOIN customers c ON c.id = d.customer_id JOIN sales s ON s.id = d.sale_id
         WHERE d.status != 'paid' ${bidSql} ORDER BY d.due_date ASC`, bidParams);
      rows = drows;
    } else {
      title = 'Laporan Hutang';
      columns = [
        { header: 'Supplier', key: 'supplier_name', width: 24 },
        { header: 'No PO', key: 'purchase_no', width: 20 },
        { header: 'Sisa', key: 'sisa', width: 20, type: 'number' },
        { header: 'Jatuh Tempo', key: 'due_date', width: 16 },
        { header: 'Umur (hari)', key: 'umur_hari', width: 12, type: 'number' },
      ];
      const [drows] = await pool.query(
        `SELECT s.name AS supplier_name, p.purchase_no, (d.amount - d.paid_amount) AS sisa,
                d.due_date, DATEDIFF(CURDATE(), d.due_date) AS umur_hari
         FROM debts d JOIN suppliers s ON s.id = d.supplier_id JOIN purchases p ON p.id = d.purchase_id
         WHERE d.status != 'paid' ${bidSql} ORDER BY d.due_date ASC`, bidParams);
      rows = drows;
    }
  }

  const fname = `${type}-${start}-${end}.${format}`;
  if (format === 'xlsx') {
    const buf = await buildXlsx({ title, sheetName: type.toUpperCase(), columns, rows });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
    return res.send(buf);
  }
  const buf = await buildPdf({ title, columns, rows, summary });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
  return res.send(buf);
});

/* GET /api/export/invoice/:saleId - PDF struk/invoice penjualan */
exports.invoice = asyncHandler(async (req, res) => {
  const [saleRows] = await pool.query(
    `SELECT s.*, b.name AS branch_name, b.address AS branch_address, u.full_name AS cashier
     FROM sales s JOIN branches b ON b.id = s.branch_id JOIN users u ON u.id = s.user_id
     WHERE s.id = ?`, [req.params.saleId]);
  if (!saleRows.length) return res.status(404).json({ success: false, message: 'Penjualan tidak ditemukan' });
  const sale = saleRows[0];
  const [items] = await pool.query(
    `SELECT si.* FROM sale_items si WHERE si.sale_id = ? ORDER BY si.id`, [req.params.saleId]);

  const doc = require('../services/exporter');
  const PDFDocument = require('pdfkit');
  const chunks = [];
  const pdf = new PDFDocument({ size: 'A4', margin: 40 });
  pdf.on('data', (c) => chunks.push(c));

  pdf.rect(0, 0, pdf.page.width, 60).fill('#4F46E5');
  pdf.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold').text('LunaPOS', 40, 16);
  pdf.fontSize(9).font('Helvetica').text('INVOICE', pdf.page.width - 120, 20, { width: 80, align: 'right' });
  pdf.moveDown(3);

  pdf.fillColor('#111827').fontSize(14).font('Helvetica-Bold').text('Faktur Penjualan', 40, 80);
  pdf.fontSize(9).font('Helvetica').fillColor('#374151');
  const meta = [
    ['No. Invoice', sale.invoice_no],
    ['Tanggal', new Date(sale.created_at).toLocaleString('id-ID')],
    ['Cabang', sale.branch_name],
    ['Kasir', sale.cashier],
    ['Pelanggan', sale.customer_name || 'Umum'],
    ['Metode Bayar', { cash: 'Tunai', transfer: 'Transfer', qris: 'QRIS', debt: 'Hutang', mixed: 'Campuran' }[sale.payment_method] || sale.payment_method],
  ];
  let y = 110;
  meta.forEach(([k, v]) => {
    pdf.font('Helvetica-Bold').text(k + ':', 40, y, { continued: true, width: 130 });
    pdf.font('Helvetica').text(String(v), 175, y);
    y += 15;
  });

  // Tabel item
  y += 10;
  const colX = [40, 240, 320, 400, 480];
  const headers = ['Produk', 'Harga', 'Qty', 'Diskon', 'Subtotal'];
  const drawHeader = () => {
    pdf.font('Helvetica-Bold').fontSize(8).fillColor('#1E1B4B');
    headers.forEach((h, i) => pdf.text(h, colX[i], y));
    pdf.moveTo(40, y + 12).lineTo(560, y + 12).stroke('#4F46E5').lineWidth(0.8);
    y += 18;
  };
  drawHeader();
  pdf.font('Helvetica').fontSize(8).fillColor('#111827');
  items.forEach((it) => {
    if (y > pdf.page.height - 120) { pdf.addPage(); y = 60; drawHeader(); }
    pdf.text(it.product_name, colX[0], y, { width: 190 });
    pdf.text('Rp ' + Number(it.unit_price).toLocaleString('id-ID'), colX[1], y);
    pdf.text(String(it.qty) + ' ' + (it.unit_name || ''), colX[2], y);
    pdf.text('Rp ' + Number(it.discount).toLocaleString('id-ID'), colX[3], y);
    pdf.text('Rp ' + Number(it.subtotal).toLocaleString('id-ID'), colX[4], y);
    y += 15;
  });
  pdf.moveTo(40, y).lineTo(560, y).stroke('#E5E7EB');
  y += 8;

  const totals = [
    ['Subtotal', 'Rp ' + Number(sale.subtotal).toLocaleString('id-ID')],
    ['Diskon', '- Rp ' + Number(sale.discount_total).toLocaleString('id-ID')],
    ['Pajak', 'Rp ' + Number(sale.tax).toLocaleString('id-ID')],
  ];
  if (num(sale.debt_amount) > 0) totals.push(['Hutang', 'Rp ' + Number(sale.debt_amount).toLocaleString('id-ID')]);
  totals.push(['TOTAL', 'Rp ' + Number(sale.total).toLocaleString('id-ID')]);
  totals.forEach(([k, v]) => {
    pdf.font(k === 'TOTAL' ? 'Helvetica-Bold' : 'Helvetica').fontSize(k === 'TOTAL' ? 11 : 9);
    pdf.fillColor(k === 'TOTAL' ? '#4F46E5' : '#111827');
    pdf.text(k, 380, y, { width: 100 });
    pdf.text(v, 470, y, { width: 90, align: 'right' });
    y += k === 'TOTAL' ? 20 : 15;
  });
  if (sale.note) {
    y += 10;
    pdf.font('Helvetica').fontSize(8).fillColor('#6B7280').text('Catatan: ' + sale.note, 40, y);
  }
  pdf.font('Helvetica').fontSize(8).fillColor('#9CA3AF').text('Terima kasih telah berbelanja di ' + sale.branch_name, 40, pdf.page.height - 40, { align: 'center', width: pdf.page.width - 80 });

  pdf.end();
  const buf = await new Promise((resolve) => pdf.on('end', () => resolve(Buffer.concat(chunks))));
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${sale.invoice_no}.pdf"`);
  return res.send(buf);
});

module.exports = { report: exports.report, invoice: exports.invoice };
