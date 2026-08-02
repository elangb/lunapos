export const rupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(n) || 0);

export const number = (n) => {
  const v = Number(n);
  return isNaN(v) ? 0 : v;
};

export const fmtQty = (n) => {
  const v = Number(n) || 0;
  return Number.isInteger(v) ? v.toString() : v.toFixed(2).replace(/\.?0+$/, '');
};

export const fmtDate = (d, withTime = false) => {
  if (!d) return '-';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  const opts = withTime
    ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' };
  return dt.toLocaleDateString('id-ID', opts);
};

export const today = () => new Date().toISOString().slice(0, 10);

export const periodPresets = [
  { key: 'today', label: 'Hari Ini' },
  { key: 'yesterday', label: 'Kemarin' },
  { key: 'this_week', label: 'Minggu Ini' },
  { key: 'this_month', label: 'Bulan Ini' },
  { key: 'this_year', label: 'Tahun Ini' },
  { key: 'custom', label: 'Custom' },
];

export const downloadCSV = (filename, headers, rows) => {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
};

export const typeLabels = {
  sale: 'Penjualan', purchase: 'Pembelian', transfer_in: 'Transfer Masuk', transfer_out: 'Transfer Keluar',
  opname: 'Opname', return_in: 'Retur Masuk', return_out: 'Retur Keluar', manual: 'Manual',
  cash: 'Cash', transfer: 'Transfer', qris: 'QRIS', debt: 'Hutang', mixed: 'Campuran',
  in: 'Kas Masuk', out: 'Kas Keluar', setor: 'Setor ke Pusat', tarik: 'Tarik Tunai',
  open_balance: 'Saldo Awal', sale_cash: 'Penjualan Cash', debt_payment: 'Bayar Hutang', receivable_payment: 'Bayar Piutang',
  bogo: 'Beli X Gratis Y', discount: 'Diskon %',
  product: 'Produk', category: 'Kategori', all: 'Semua',
  umum: 'Umum', grosir: 'Grosir', member: 'Member',
  pending: 'Pending', approved: 'Disetujui', rejected: 'Ditolak',
  open: 'Open', submitted: 'Dikirim', closed: 'Tutup',
  unpaid: 'Belum Lunas', partial: 'Sebagian', paid: 'Lunas',
};
