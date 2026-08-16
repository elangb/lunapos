const pool = require('../config/db');
const { ok, asyncHandler } = require('../utils/helpers');

const num = (v) => parseFloat(v) || 0;

/* Period helper: ?period=today|yesterday|this_week|this_month|this_year atau from/to */
function getRange(req) {
  const { period, from, to } = req.query;
  const now = new Date();
  const d = (dt) => dt.toISOString().slice(0, 10);
  let start = from;
  let end = to;
  if (period === 'today') { start = d(now); end = d(now); }
  if (period === 'yesterday') {
    const y = new Date(now); y.setDate(y.getDate() - 1); start = d(y); end = d(y);
  }
  if (period === 'this_week') {
    const day = (now.getDay() + 6) % 7; // Senin = 0
    const s = new Date(now); s.setDate(now.getDate() - day); start = d(s); end = d(now);
  }
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

/* GET /api/reports/dashboard */
exports.dashboard = asyncHandler(async (req, res) => {
  const bid = req.query.branch_id || req.user.branch_id;
  const branchSql = bid ? 'AND s.branch_id = ?' : '';
  const params = bid ? [bid] : [];

  const [[today]] = await pool.query(
    `SELECT IFNULL(SUM(s.total),0) AS omzet, COUNT(*) AS transaksi,
            IFNULL(SUM(s.total - s.tax),0) AS gross, IFNULL(SUM(s.debt_amount),0) AS piutang_baru
     FROM sales s WHERE s.status = 'completed' AND DATE(s.created_at) = CURDATE() ${branchSql}`,
    params
  );
  const [[profit]] = await pool.query(
    `SELECT IFNULL(SUM((si.unit_price * si.qty) - (si.qty * p.buy_price) - si.discount),0) AS laba
     FROM sale_items si JOIN products p ON p.id = si.product_id
     JOIN sales s ON s.id = si.sale_id
     WHERE s.status = 'completed' AND DATE(s.created_at) = CURDATE() AND si.is_free = 0 ${branchSql}`,
    params
  );
  const [[hutang]] = await pool.query(
    `SELECT IFNULL(SUM(amount - paid_amount),0) AS total FROM debts WHERE status != 'paid' ${req.user.branch_id ? 'AND branch_id = ?' : ''}`,
    req.user.branch_id ? [req.user.branch_id] : []
  );
  const [[piutang]] = await pool.query(
    `SELECT IFNULL(SUM(amount - paid_amount),0) AS total FROM receivables WHERE status != 'paid' ${req.user.branch_id ? 'AND branch_id = ?' : ''}`,
    req.user.branch_id ? [req.user.branch_id] : []
  );
  const [[lowStock]] = await pool.query(
    `SELECT COUNT(*) AS total FROM product_stocks ps JOIN products p ON p.id = ps.product_id
     WHERE ps.qty <= p.min_stock AND p.is_active = 1 ${req.user.branch_id ? 'AND ps.branch_id = ?' : ''}`,
    req.user.branch_id ? [req.user.branch_id] : []
  );
  const [[branches]] = await pool.query('SELECT COUNT(*) AS total FROM branches WHERE is_active = 1');

  // Batch / expiry (produk kadaluarsa & segera kadaluarsa)
  const bidb = req.user.branch_id;
  const bidbParams = bidb ? [bidb] : [];
  const bidbSql = bidb ? 'AND branch_id = ?' : '';
  const [[expiredBatches]] = await pool.query(
    `SELECT IFNULL(SUM(qty),0) AS qty, COUNT(*) AS total FROM product_batches
     WHERE qty > 0 AND expiry_date IS NOT NULL AND expiry_date < CURDATE() ${bidbSql}`, bidbParams);
  const [[expiringBatches]] = await pool.query(
    `SELECT IFNULL(SUM(qty),0) AS qty, COUNT(*) AS total FROM product_batches
     WHERE qty > 0 AND expiry_date IS NOT NULL AND expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) ${bidbSql}`, bidbParams);

  // 7 hari terakhir
  const [last7] = await pool.query(
    `SELECT DATE(s.created_at) AS date, IFNULL(SUM(s.total),0) AS total, COUNT(*) AS transaksi
     FROM sales s WHERE s.status = 'completed' AND s.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) ${branchSql}
     GROUP BY DATE(s.created_at) ORDER BY date`,
    params
  );
  // 12 bulan terakhir
  const [last12] = await pool.query(
    `SELECT DATE_FORMAT(s.created_at, '%Y-%m') AS month, IFNULL(SUM(s.total),0) AS total
     FROM sales s WHERE s.status = 'completed' AND s.created_at >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH) ${branchSql}
     GROUP BY DATE_FORMAT(s.created_at, '%Y-%m') ORDER BY month`,
    params
  );
  // Top 10 produk
  const [topProducts] = await pool.query(
    `SELECT p.id, p.name, IFNULL(SUM(si.qty),0) AS qty, IFNULL(SUM(si.subtotal),0) AS total
     FROM sale_items si JOIN products p ON p.id = si.product_id
     JOIN sales s ON s.id = si.sale_id
     WHERE s.status = 'completed' AND DATE(s.created_at) = CURDATE() AND si.is_free = 0 ${branchSql}
     GROUP BY p.id, p.name ORDER BY total DESC LIMIT 10`,
    params
  );
  // Top 5 cabang
  const [topBranches] = await pool.query(
    `SELECT b.id, b.name, IFNULL(SUM(s.total),0) AS total FROM sales s
     JOIN branches b ON b.id = s.branch_id
     WHERE s.status = 'completed' AND DATE(s.created_at) = CURDATE() AND s.branch_id IS NOT NULL
     GROUP BY b.id, b.name ORDER BY total DESC LIMIT 5`
  );

  return ok(res, {
    today: { omzet: num(today.omzet), transaksi: today.transaksi, laba: num(profit.laba), piutang_baru: num(today.piutang_baru) },
    hutang: num(hutang.total), piutang: num(piutang.total), low_stock: lowStock.total, cabang_aktif: branches.total,
    expiry: {
      expired: { qty: num(expiredBatches.qty), total: expiredBatches.total },
      expiring: { qty: num(expiringBatches.qty), total: expiringBatches.total },
    },
    last7, last12, top_products: topProducts, top_branches: topBranches,
  });
});

/* GET /api/reports/sales?period=&breakdown=cashier|branch|product|category|customer|type|method */
exports.sales = asyncHandler(async (req, res) => {
  const { start, end } = getRange(req);
  const { breakdown } = req.query;
  const params = [`${start} 00:00:00`, `${end} 23:59:59`];
  const branchSql = branchWhere(req, 's', params);

  const [[summary]] = await pool.query(
    `SELECT IFNULL(SUM(s.total),0) AS omzet, COUNT(*) AS transaksi, IFNULL(SUM(s.debt_amount),0) AS piutang,
            IFNULL(AVG(s.total),0) AS rata_rata, IFNULL(SUM(s.total - s.tax),0) AS gross
     FROM sales s WHERE s.status = 'completed' AND s.created_at BETWEEN ? AND ? AND ${branchSql}`,
    params
  );
  const [[profit]] = await pool.query(
    `SELECT IFNULL(SUM((si.unit_price * si.qty) - (si.qty * p.buy_price) - si.discount),0) AS laba
     FROM sale_items si JOIN products p ON p.id = si.product_id JOIN sales s ON s.id = si.sale_id
     WHERE s.status = 'completed' AND s.created_at BETWEEN ? AND ? AND ${branchSql} AND si.is_free = 0`,
    params
  );

  let rows = [];
  if (breakdown === 'cashier') {
    [rows] = await pool.query(
      `SELECT u.id, u.full_name, COUNT(*) AS transaksi, IFNULL(SUM(s.total),0) AS total
       FROM sales s JOIN users u ON u.id = s.user_id
       WHERE s.status = 'completed' AND s.created_at BETWEEN ? AND ? AND ${branchSql}
       GROUP BY u.id, u.full_name ORDER BY total DESC`, params);
  } else if (breakdown === 'branch') {
    [rows] = await pool.query(
      `SELECT b.id, b.name, COUNT(*) AS transaksi, IFNULL(SUM(s.total),0) AS total
       FROM sales s JOIN branches b ON b.id = s.branch_id
       WHERE s.status = 'completed' AND s.created_at BETWEEN ? AND ? AND s.branch_id IS NOT NULL
       GROUP BY b.id, b.name ORDER BY total DESC`, [params[0], params[1]]);
  } else if (breakdown === 'product') {
    [rows] = await pool.query(
      `SELECT p.id, p.name, IFNULL(SUM(si.qty),0) AS qty, IFNULL(SUM(si.subtotal),0) AS total
       FROM sale_items si JOIN products p ON p.id = si.product_id JOIN sales s ON s.id = si.sale_id
       WHERE s.status = 'completed' AND s.created_at BETWEEN ? AND ? AND ${branchSql} AND si.is_free = 0
       GROUP BY p.id, p.name ORDER BY total DESC LIMIT 100`, params);
  } else if (breakdown === 'category') {
    [rows] = await pool.query(
      `SELECT c.id, c.name, IFNULL(SUM(si.subtotal),0) AS total
       FROM sale_items si JOIN products p ON p.id = si.product_id JOIN sales s ON s.id = si.sale_id
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE s.status = 'completed' AND s.created_at BETWEEN ? AND ? AND ${branchSql} AND si.is_free = 0
       GROUP BY c.id, c.name ORDER BY total DESC`, params);
  } else if (breakdown === 'customer') {
    [rows] = await pool.query(
      `SELECT s.customer_id, IFNULL(s.customer_name, 'Umum') AS name, COUNT(*) AS transaksi, IFNULL(SUM(s.total),0) AS total
       FROM sales s WHERE s.status = 'completed' AND s.created_at BETWEEN ? AND ? AND ${branchSql}
       GROUP BY s.customer_id, s.customer_name ORDER BY total DESC LIMIT 50`, params);
  } else if (breakdown === 'type') {
    [rows] = await pool.query(
      `SELECT IFNULL(c.type, 'umum') AS customer_type, COUNT(*) AS transaksi, IFNULL(SUM(s.total),0) AS total
       FROM sales s LEFT JOIN customers c ON c.id = s.customer_id
       WHERE s.status = 'completed' AND s.created_at BETWEEN ? AND ? AND ${branchSql}
       GROUP BY customer_type ORDER BY total DESC`, params);
  } else if (breakdown === 'method') {
    [rows] = await pool.query(
      `SELECT s.payment_method, COUNT(*) AS transaksi, IFNULL(SUM(s.total),0) AS total
       FROM sales s WHERE s.status = 'completed' AND s.created_at BETWEEN ? AND ? AND ${branchSql}
       GROUP BY s.payment_method ORDER BY total DESC`, params);
  } else {
    [rows] = await pool.query(
      `SELECT DATE(s.created_at) AS date, COUNT(*) AS transaksi, IFNULL(SUM(s.total),0) AS total
       FROM sales s WHERE s.status = 'completed' AND s.created_at BETWEEN ? AND ? AND ${branchSql}
       GROUP BY DATE(s.created_at) ORDER BY date`, params);
  }

  return ok(res, { summary: { ...summary, laba: num(profit.laba) }, rows, range: { start, end } });
});

/* GET /api/reports/purchases?period=&breakdown=supplier|product|branch */
exports.purchases = asyncHandler(async (req, res) => {
  const { start, end } = getRange(req);
  const { breakdown } = req.query;
  const params = [`${start} 00:00:00`, `${end} 23:59:59`];
  const branchSql = branchWhere(req, 'p', params);

  const [[summary]] = await pool.query(
    `SELECT IFNULL(SUM(p.total),0) AS total, COUNT(*) AS transaksi FROM purchases p
     WHERE p.created_at BETWEEN ? AND ? AND ${branchSql}`, params);
  let rows = [];
  if (breakdown === 'supplier') {
    [rows] = await pool.query(
      `SELECT s.id, s.name, COUNT(*) AS transaksi, IFNULL(SUM(p.total),0) AS total
       FROM purchases p JOIN suppliers s ON s.id = p.supplier_id
       WHERE p.created_at BETWEEN ? AND ? AND ${branchSql}
       GROUP BY s.id, s.name ORDER BY total DESC`, params);
  } else if (breakdown === 'product') {
    [rows] = await pool.query(
      `SELECT prd.id, prd.name, IFNULL(SUM(pi.qty),0) AS qty, IFNULL(SUM(pi.subtotal),0) AS total
       FROM purchase_items pi JOIN products prd ON prd.id = pi.product_id JOIN purchases p ON p.id = pi.purchase_id
       WHERE p.created_at BETWEEN ? AND ? AND ${branchSql}
       GROUP BY prd.id, prd.name ORDER BY total DESC LIMIT 100`, params);
  } else if (breakdown === 'branch') {
    [rows] = await pool.query(
      `SELECT b.id, b.name, COUNT(*) AS transaksi, IFNULL(SUM(p.total),0) AS total
       FROM purchases p JOIN branches b ON b.id = p.branch_id
       WHERE p.created_at BETWEEN ? AND ? AND p.branch_id IS NOT NULL
       GROUP BY b.id, b.name ORDER BY total DESC`, [params[0], params[1]]);
  } else {
    [rows] = await pool.query(
      `SELECT DATE(p.created_at) AS date, COUNT(*) AS transaksi, IFNULL(SUM(p.total),0) AS total
       FROM purchases p WHERE p.created_at BETWEEN ? AND ? AND ${branchSql}
       GROUP BY DATE(p.created_at) ORDER BY date`, params);
  }
  return ok(res, { summary, rows, range: { start, end } });
});

/* GET /api/reports/cash */
exports.cash = asyncHandler(async (req, res) => {
  const { start, end } = getRange(req);
  const params = [`${start} 00:00:00`, `${end} 23:59:59`];
  const branchSql = branchWhere(req, 'ct', params);
  const [rows] = await pool.query(
    `SELECT ct.type, COUNT(*) AS jumlah, IFNULL(SUM(ct.amount),0) AS total
     FROM cash_transactions ct WHERE ct.created_at BETWEEN ? AND ? AND ${branchSql}
     GROUP BY ct.type ORDER BY ct.type`, params);
  const [[balance]] = await pool.query(
    `SELECT IFNULL(SUM(CASE WHEN type IN ('sale','in','tarik','debt_payment','receivable_payment','open_balance') THEN amount
                           WHEN type IN ('out','setor','purchase') THEN -amount ELSE 0 END),0) AS saldo
     FROM cash_transactions ct WHERE ct.created_at BETWEEN ? AND ? AND ${branchSql}`, params);
  return ok(res, { rows, saldo: num(balance.saldo), range: { start, end } });
});

/* GET /api/reports/stock?view=current|low|not_sold|best */
exports.stock = asyncHandler(async (req, res) => {
  const { view, from, to } = req.query;
  const bid = req.query.branch_id || req.user.branch_id;
  const bidSql = bid ? 'AND ps.branch_id = ?' : '';
  const bidParams = bid ? [bid] : [];

  if (view === 'low') {
    const [rows] = await pool.query(
      `SELECT p.id, p.code, p.name, p.min_stock, ps.qty AS stock_qty, b.name AS branch_name
       FROM product_stocks ps JOIN products p ON p.id = ps.product_id JOIN branches b ON b.id = ps.branch_id
       WHERE p.is_active = 1 AND ps.qty <= p.min_stock ${bidSql}
       ORDER BY (ps.qty - p.min_stock) ASC`, bidParams);
    return ok(res, rows);
  }
  if (view === 'not_sold') {
    const s = from || '2000-01-01'; const e = to || '2099-12-31';
    const [rows] = await pool.query(
      `SELECT p.id, p.code, p.name, IFNULL(ps.qty,0) AS stock_qty, p.buy_price, p.retail_price
       FROM products p LEFT JOIN product_stocks ps ON ps.product_id = p.id ${bid ? 'AND ps.branch_id = ?' : ''}
       WHERE p.is_active = 1 AND p.id NOT IN (
         SELECT DISTINCT si.product_id FROM sale_items si JOIN sales s ON s.id = si.sale_id
         WHERE s.status = 'completed' AND s.created_at BETWEEN ? AND ?
       )`,
      bid ? [...bidParams, `${s} 00:00:00`, `${e} 23:59:59`] : [`${s} 00:00:00`, `${e} 23:59:59`]
    );
    return ok(res, rows);
  }
  if (view === 'best') {
    const s = from || '2000-01-01'; const e = to || '2099-12-31';
    const [rows] = await pool.query(
      `SELECT p.id, p.code, p.name, IFNULL(SUM(si.qty),0) AS qty, IFNULL(SUM(si.subtotal),0) AS total
       FROM sale_items si JOIN products p ON p.id = si.product_id JOIN sales s ON s.id = si.sale_id
       WHERE s.status = 'completed' AND s.created_at BETWEEN ? AND ? AND si.is_free = 0
         ${bid ? 'AND s.branch_id = ?' : ''}
       GROUP BY p.id, p.code, p.name ORDER BY total DESC LIMIT 50`,
      [`${s} 00:00:00`, `${e} 23:59:59`, ...bidParams]
    );
    return ok(res, rows);
  }
  // current
  const [rows] = await pool.query(
    `SELECT p.id, p.code, p.name, c.name AS category_name, ps.qty AS stock_qty, p.min_stock,
            p.buy_price, p.retail_price, p.wholesale_price, p.member_price, b.name AS branch_name,
            u.short_name AS unit
     FROM product_stocks ps JOIN products p ON p.id = ps.product_id
     LEFT JOIN categories c ON c.id = p.category_id
     JOIN branches b ON b.id = ps.branch_id
     JOIN units u ON u.id = p.base_unit_id
     WHERE p.is_active = 1 ${bidSql}
     ORDER BY p.name`, bidParams);
  return ok(res, rows);
});

/* GET /api/reports/debts?view=hutang|piutang */
exports.debts = asyncHandler(async (req, res) => {
  const { view, status } = req.query;
  const bid = req.query.branch_id || req.user.branch_id;
  const bidSql = bid ? 'AND d.branch_id = ?' : '';
  const bidParams = bid ? [bid] : [];

  if (view === 'piutang') {
    const [rows] = await pool.query(
      `SELECT d.*, c.name AS customer_name, s.invoice_no,
              DATEDIFF(CURDATE(), d.due_date) AS umur_hari
       FROM receivables d JOIN customers c ON c.id = d.customer_id JOIN sales s ON s.id = d.sale_id
       WHERE d.status != 'paid' ${bidSql.replace('d.branch_id', 'd.branch_id')}
       ORDER BY d.due_date ASC`, bidParams);
    const [aging] = await pool.query(
      `SELECT
        IFNULL(SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) <= 30 THEN amount - paid_amount ELSE 0 END),0) AS a_30,
        IFNULL(SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) BETWEEN 31 AND 60 THEN amount - paid_amount ELSE 0 END),0) AS a_60,
        IFNULL(SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) BETWEEN 61 AND 90 THEN amount - paid_amount ELSE 0 END),0) AS a_90,
        IFNULL(SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) > 90 THEN amount - paid_amount ELSE 0 END),0) AS a_90plus
       FROM receivables WHERE status != 'paid' ${req.user.branch_id ? 'AND branch_id = ?' : ''}`,
      req.user.branch_id ? [req.user.branch_id] : []);
    return ok(res, { rows, aging: aging[0], range: 'piutang' });
  }

  const [rows] = await pool.query(
    `SELECT d.*, s.name AS supplier_name, p.purchase_no,
            DATEDIFF(CURDATE(), d.due_date) AS umur_hari
     FROM debts d JOIN suppliers s ON s.id = d.supplier_id JOIN purchases p ON p.id = d.purchase_id
     WHERE d.status != 'paid' ${bidSql}
     ORDER BY d.due_date ASC`, bidParams);
  const [aging] = await pool.query(
    `SELECT
      IFNULL(SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) <= 30 THEN amount - paid_amount ELSE 0 END),0) AS a_30,
      IFNULL(SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) BETWEEN 31 AND 60 THEN amount - paid_amount ELSE 0 END),0) AS a_60,
      IFNULL(SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) BETWEEN 61 AND 90 THEN amount - paid_amount ELSE 0 END),0) AS a_90,
      IFNULL(SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) > 90 THEN amount - paid_amount ELSE 0 END),0) AS a_90plus
     FROM debts WHERE status != 'paid' ${req.user.branch_id ? 'AND branch_id = ?' : ''}`,
    req.user.branch_id ? [req.user.branch_id] : []);
  return ok(res, { rows, aging: aging[0], range: 'hutang' });
});

/* GET /api/reports/monthly?year= */
exports.monthly = asyncHandler(async (req, res) => {
  const year = req.query.year || new Date().getFullYear();
  const bid = req.query.branch_id || req.user.branch_id;
  const params = [year];
  const bidSql = bid ? 'AND s.branch_id = ?' : '';
  if (bid) params.push(bid);

  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(s.created_at, '%Y-%m') AS month,
            COUNT(*) AS transaksi,
            IFNULL(SUM(s.total),0) AS omzet,
            IFNULL(AVG(s.total),0) AS rata_rata,
            IFNULL(SUM(s.total - s.tax),0) AS gross
     FROM sales s
     WHERE s.status = 'completed' AND YEAR(s.created_at) = ? ${bidSql}
     GROUP BY DATE_FORMAT(s.created_at, '%Y-%m') ORDER BY month`,
    params
  );
  const [labaRows] = await pool.query(
    `SELECT DATE_FORMAT(s.created_at, '%Y-%m') AS month,
            IFNULL(SUM((si.unit_price * si.qty) - (si.qty * p.buy_price) - si.discount),0) AS laba
     FROM sale_items si JOIN products p ON p.id = si.product_id JOIN sales s ON s.id = si.sale_id
     WHERE s.status = 'completed' AND YEAR(s.created_at) = ? AND si.is_free = 0 ${bidSql}
     GROUP BY DATE_FORMAT(s.created_at, '%Y-%m')`,
    params
  );
  const labaMap = Object.fromEntries(labaRows.map((r) => [r.month, num(r.laba)]));
  return ok(res, rows.map((r) => ({ ...r, laba: labaMap[r.month] ?? 0 })));
});
