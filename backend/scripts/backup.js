/* Backup database LunaPOS ke file SQL — murni Node.js (tanpa mysqldump).
   Output : backend/backups/lunapos-<timestamp>.sql
   Usage  : npm run backup [--keep=N]   (default simpan 10 backup terakhir) */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const DB_NAME = process.env.DB_NAME || 'lunapos';
const BACKUP_DIR = path.join(__dirname, '../backups');
const keepArg = process.argv.find((a) => a.startsWith('--keep='));
const KEEP = keepArg ? parseInt(keepArg.split('=')[1], 10) || 10 : 10;

function sqlValue(v) {
  if (v === null || v === undefined) return 'NULL';
  if (Buffer.isBuffer(v)) return `0x${v.toString('hex')}`;
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
  if (typeof v === 'object') v = JSON.stringify(v); // kolom JSON di-parse mysql2 -> objek
  return `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: +(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: DB_NAME,
    dateStrings: true,
    decimalNumbers: false,
  });

  console.log(`>> Membaca struktur & data database "${DB_NAME}" ...`);
  const [tables] = await conn.query(
    'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME',
    [DB_NAME]
  );
  if (!tables.length) throw new Error(`Database "${DB_NAME}" tidak ditemukan / kosong`);

  const lines = [
    `-- LunaPOS Backup: ${new Date().toISOString()}`,
    `-- Database: ${DB_NAME}`,
    'SET NAMES utf8mb4;',
    'SET FOREIGN_KEY_CHECKS=0;',
  ];
  for (const { TABLE_NAME: name } of tables) lines.push(`DROP TABLE IF EXISTS \`${name}\`;`);

  for (const { TABLE_NAME: name } of tables) {
    const [ddl] = await conn.query(`SHOW CREATE TABLE \`${name}\``);
    lines.push(ddl[0]['Create Table'] + ';');
  }

  for (const { TABLE_NAME: name } of tables) {
    const [rows] = await conn.query(`SELECT * FROM \`${name}\``);
    if (!rows.length) continue;
    const cols = Object.keys(rows[0]);
    const colList = cols.map((c) => `\`${c}\``).join(', ');
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      const values = chunk.map((r) => `(${cols.map((c) => sqlValue(r[c])).join(', ')})`).join(',\n');
      lines.push(`INSERT INTO \`${name}\` (${colList}) VALUES\n${values};`);
    }
    console.log(`   - ${name}: ${rows.length} baris`);
  }
  lines.push('SET FOREIGN_KEY_CHECKS=1;');

  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const file = path.join(BACKUP_DIR, `lunapos-${stamp}.sql`);
  fs.writeFileSync(file, lines.join('\n') + '\n');

  // Bersihkan backup lama
  const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.sql')).sort();
  const remove = files.slice(0, Math.max(0, files.length - KEEP));
  for (const f of remove) fs.unlinkSync(path.join(BACKUP_DIR, f));

  console.log(`\n✅ Backup selesai: ${file} (${(fs.statSync(file).size / 1024).toFixed(1)} KB)`);
  if (remove.length) console.log(`   Backup lama dihapus: ${remove.join(', ')}`);
  await conn.end();
}

run().catch((e) => {
  console.error('❌ Backup gagal:', e.message);
  process.exit(1);
});
