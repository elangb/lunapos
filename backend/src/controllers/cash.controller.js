const pool = require('../config/db');
const { ok, fail, asyncHandler, paginate, audit } = require('../utils/helpers');

const num = (v) => parseFloat(v) || 0;
const round2 = (n) => Math.round(n * 100) / 100;

/* ============ SHIFT KASIR ============ */
/* POST /api/cash/shifts/open */
exports.openShift = asyncHandler(async (req, res) => {
  const { opening_cash, note } = req.body;
  const branchId = req.user.branch_id;
  if (!branchId) return fail(res, 400, 'Cabang tidak ditemukan');
  const [open] = await pool.query(
    "SELECT id FROM shifts WHERE branch_id = ? AND user_id = ? AND status = 'open'",
    [branchId, req.user.id]
  );
  if (open.length) return fail(res, 400, 'Shift masih terbuka, tutup dulu sebelum buka baru');
  const [result] = await pool.query(
    'INSERT INTO shifts (branch_id, user_id, opening_cash, note) VALUES (?,?,?,?)',
    [branchId, req.user.id, num(opening_cash) || 0, note || null]
  );
  await pool.query(
    'INSERT INTO cash_transactions (branch_id, shift_id, user_id, type, amount, note) VALUES (?,?,?,?,?,?)',
    [branchId, result.insertId, req.user.id, 'open_balance', num(opening_cash) || 0, 'Saldo awal shift']
  );
  await audit(req.user.id, 'open_shift', 'shifts', result.insertId, null, { opening_cash }, req);
  return ok(res, { id: result.insertId }, 'Shift dibuka');
});

/* POST /api/cash/shifts/:id/close */
exports.closeShift = asyncHandler(async (req, res) => {
  const { physical_cash, note } = req.body;
  const [rows] = await pool.query("SELECT * FROM shifts WHERE id = ? AND status = 'open'", [req.params.id]);
  if (!rows.length) return fail(res, 404, 'Shift tidak ditemukan / sudah ditutup');
  const shift = rows[0];
  const [[{ expected }]] = await pool.query(
    `SELECT IFNULL(SUM(CASE WHEN type IN ('sale','in','tarik','debt_payment','receivable_payment','open_balance') THEN amount
                           WHEN type IN ('out','setor','purchase') THEN -amount ELSE 0 END), 0) AS expected
     FROM cash_transactions WHERE shift_id = ?`,
    [req.params.id]
  );
  const expectedCash = round2(num(expected));
  const phys = num(physical_cash);
  const diff = round2(phys - expectedCash);
  await pool.query(
    'UPDATE shifts SET closed_at = NOW(), closing_cash = ?, expected_cash = ?, physical_cash = ?, difference = ?, status = "closed", note = COALESCE(?, note) WHERE id = ?',
    [phys, expectedCash, phys, diff, note || null, req.params.id]
  );
  await audit(req.user.id, 'close_shift', 'shifts', req.params.id, shift, { expected_cash: expectedCash, physical_cash: phys, difference: diff }, req);
  return ok(res, { expected_cash: expectedCash, physical_cash: phys, difference: diff }, 'Shift ditutup');
});

/* GET /api/cash/shifts */
exports.listShifts = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req);
  const { status, from, to } = req.query;
  const where = [];
  const params = [];
  if (req.user.branch_id && req.user.role_id !== 1 && req.user.role_id !== 2) { where.push('s.branch_id = ?'); params.push(req.user.branch_id); }
  if (status) { where.push('s.status = ?'); params.push(status); }
  if (from) { where.push('s.opened_at >= ?'); params.push(`${from} 00:00:00`); }
  if (to) { where.push('s.opened_at <= ?'); params.push(`${to} 23:59:59`); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT s.*, b.name AS branch_name, u.full_name AS user_name FROM shifts s
     JOIN branches b ON b.id = s.branch_id JOIN users u ON u.id = s.user_id
     ${whereSql} ORDER BY s.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM shifts s ${whereSql}`, params);
  return ok(res, rows, 'OK', { page, limit, total });
});

/* GET /api/cash/shifts/current - shift terbuka user ini */
exports.currentShift = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM shifts WHERE user_id = ? AND status = 'open' ORDER BY id DESC LIMIT 1",
    [req.user.id]
  );
  return ok(res, rows[0] || null);
});

/* ============ TRANSAKSI KAS ============ */
/* POST /api/cash/transactions  {type: in|out|setor|tarik, amount, note} */
exports.createTransaction = asyncHandler(async (req, res) => {
  const { type, amount, note } = req.body;
  if (!['in', 'out', 'setor', 'tarik'].includes(type)) return fail(res, 400, 'Tipe tidak valid');
  if (!amount || amount <= 0) return fail(res, 400, 'Jumlah wajib');
  const branchId = req.user.branch_id;
  if (!branchId) return fail(res, 400, 'Cabang tidak ditemukan');
  const [shift] = await pool.query(
    "SELECT id FROM shifts WHERE branch_id = ? AND user_id = ? AND status = 'open' ORDER BY id DESC LIMIT 1",
    [branchId, req.user.id]
  );
  const [result] = await pool.query(
    'INSERT INTO cash_transactions (branch_id, shift_id, user_id, type, amount, note) VALUES (?,?,?,?,?,?)',
    [branchId, shift.length ? shift[0].id : null, req.user.id, type, amount, note || null]
  );
  await audit(req.user.id, 'create_cash', 'cash_transactions', result.insertId, null, { type, amount }, req);
  return ok(res, { id: result.insertId }, 'Transaksi kas dicatat');
});

/* GET /api/cash/transactions */
exports.listTransactions = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req);
  const { type, from, to } = req.query;
  const where = [];
  const params = [];
  if (req.user.branch_id && req.user.role_id !== 1 && req.user.role_id !== 2) { where.push('ct.branch_id = ?'); params.push(req.user.branch_id); }
  if (type) { where.push('ct.type = ?'); params.push(type); }
  if (from) { where.push('ct.created_at >= ?'); params.push(`${from} 00:00:00`); }
  if (to) { where.push('ct.created_at <= ?'); params.push(`${to} 23:59:59`); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT ct.*, b.name AS branch_name, u.full_name AS user_name FROM cash_transactions ct
     JOIN branches b ON b.id = ct.branch_id JOIN users u ON u.id = ct.user_id
     ${whereSql} ORDER BY ct.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM cash_transactions ct ${whereSql}`, params);
  const [[summary]] = await pool.query(
    `SELECT
       IFNULL(SUM(CASE WHEN type IN ('sale','in','tarik','debt_payment','receivable_payment','open_balance') THEN amount ELSE 0 END),0) AS total_in,
       IFNULL(SUM(CASE WHEN type IN ('out','setor','purchase') THEN amount ELSE 0 END),0) AS total_out
     FROM cash_transactions ct ${whereSql}`,
    params
  );
  return ok(res, rows, 'OK', { page, limit, total, summary: { total_in: num(summary.total_in), total_out: num(summary.total_out), balance: round2(num(summary.total_in) - num(summary.total_out)) } });
});
