const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const pool = require('../config/db');
const { asyncHandler, ok, fail, audit } = require('../utils/helpers');

const execFileP = promisify(execFile);

const BACKUP_DIR = path.join(__dirname, '../../backups');
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

/* Lokasi mysqldump & mysql client (Laragon / PATH) */
const MYSQL_BIN = process.env.MYSQL_BIN || 'C:\\laragon\\bin\\mysql\\mysql-8.4.3-winx64\\bin';
const MYSQLDUMP = process.env.MYSQLDUMP_PATH || path.join(MYSQL_BIN, 'mysqldump.exe');
const MYSQL_CLI = process.env.MYSQL_CLI_PATH || path.join(MYSQL_BIN, 'mysql.exe');

const DB = process.env.DB_NAME || 'lunapos';
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = process.env.DB_PORT || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASSWORD || '';

const AUTH_ARGS = ['--host=' + DB_HOST, '--port=' + String(DB_PORT), '--user=' + DB_USER];
if (DB_PASS) AUTH_ARGS.push('--password=' + DB_PASS);

function listFiles() {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  return fs.readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith('.sql'))
    .map((f) => {
      const p = path.join(BACKUP_DIR, f);
      const st = fs.statSync(p);
      return {
        filename: f,
        size: st.size,
        size_label: st.size >= 1048576 ? `${(st.size / 1048576).toFixed(2)} MB` : `${Math.max(1, Math.round(st.size / 1024))} KB`,
        created_at: st.mtime.toISOString(),
      };
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/* GET /api/backup/files — daftar file backup */
exports.files = asyncHandler(async (req, res) => {
  ok(res, listFiles(), 'Daftar backup');
});

/* POST /api/backup — buat backup baru */
exports.create = asyncHandler(async (req, res) => {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
  const filename = `lunapos-backup-${stamp}.sql`;
  const out = path.join(BACKUP_DIR, filename);

  try {
    await execFileP(MYSQLDUMP, [...AUTH_ARGS, '--single-transaction', '--routines', '--triggers', '--default-character-set=utf8mb4', DB, '--result-file=' + out], { timeout: 120000 });
  } catch (e) {
    return fail(res, 500, 'Gagal membuat backup: ' + (e.message || 'mysqldump error'));
  }

  const st = fs.statSync(out);
  await audit(req.user.id, 'create_backup', 'backup', null, null, { filename, size: st.size }, req);
  ok(res, { filename, size: st.size, size_label: st.size >= 1048576 ? `${(st.size / 1048576).toFixed(2)} MB` : `${Math.max(1, Math.round(st.size / 1024))} KB`, created_at: st.mtime.toISOString() }, 'Backup berhasil dibuat');
});

/* GET /api/backup/download/:filename — unduh file backup */
exports.download = asyncHandler(async (req, res) => {
  const filename = path.basename(req.params.filename);
  const file = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(file)) return fail(res, 404, 'File backup tidak ditemukan');
  res.download(file, filename);
});

/* POST /api/backup/restore — restore dari file backup (hanya Super Admin) */
exports.restore = asyncHandler(async (req, res) => {
  if (!req.user.isSuperAdmin) return fail(res, 403, 'Hanya Super Admin yang dapat restore database');
  const filename = path.basename(req.body.filename || '');
  const file = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(file)) return fail(res, 404, 'File backup tidak ditemukan');

  try {
    await execFileP(MYSQL_CLI, [...AUTH_ARGS, DB], { input: fs.readFileSync(file, 'utf8'), timeout: 300000 });
  } catch (e) {
    return fail(res, 500, 'Restore gagal: ' + (e.message || 'mysql error'));
  }

  await audit(req.user.id, 'restore_backup', 'backup', null, null, { filename }, req);
  ok(res, { filename }, 'Database berhasil di-restore');
});

/* DELETE /api/backup/:filename — hapus file backup */
exports.remove = asyncHandler(async (req, res) => {
  const filename = path.basename(req.params.filename);
  const file = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(file)) return fail(res, 404, 'File backup tidak ditemukan');
  fs.unlinkSync(file);
  await audit(req.user.id, 'delete_backup', 'backup', null, null, { filename }, req);
  ok(res, null, 'Backup dihapus');
});

/* GET /api/backup/info — info DB (ukuran, jumlah tabel) */
exports.info = asyncHandler(async (req, res) => {
  const [[db]] = await pool.query(
    `SELECT table_schema, ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb, COUNT(*) AS tables
     FROM information_schema.tables WHERE table_schema = ? GROUP BY table_schema`, [DB]);
  ok(res, {
    database: DB,
    size_mb: db ? +db.size_mb : 0,
    tables: db ? +db.tables : 0,
    backup_count: listFiles().length,
    backup_dir: BACKUP_DIR,
  });
});