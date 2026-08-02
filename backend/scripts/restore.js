/* Restore database LunaPOS dari file backup SQL.
   Data saat ini akan DITIMPA. Minta konfirmasi YES (lewati dengan flag --yes).
   Usage : npm run restore -- <file>
           <file> = nama file di backend/backups/ ATAU path lengkap .sql */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mysql = require('mysql2/promise');

const DB_NAME = process.env.DB_NAME || 'lunapos';
const BACKUP_DIR = path.join(__dirname, '../backups');

function ask(msg) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(`${msg} Ketik YES untuk lanjut: `, (a) => {
    rl.close();
    resolve(a.trim() === 'YES');
  }));
}

async function run() {
  const arg = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!arg) {
    const list = fs.existsSync(BACKUP_DIR) ? fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.sql')) : [];
    if (list.length) {
      console.error('Pilih file backup, contoh:');
      for (const f of list.slice(-5)) console.error(`  npm run restore -- ${f}`);
    } else {
      console.error('Tidak ada backup di backend/backups/. Jalankan dulu: npm run backup');
    }
    process.exit(1);
  }

  const file = path.isAbsolute(arg)
    ? arg
    : fs.existsSync(arg)
      ? path.resolve(arg)
      : path.join(BACKUP_DIR, arg);
  if (!fs.existsSync(file)) {
    console.error(`❌ File tidak ditemukan: ${file}`);
    process.exit(1);
  }

  const ok = process.argv.includes('--yes') || await ask(
    `⚠️  Restore akan MENIMPA seluruh data "${DB_NAME}" dengan isi ${path.basename(file)}.`
  );
  if (!ok) {
    console.log('Dibatalkan.');
    process.exit(0);
  }

  const sql = fs.readFileSync(file, 'utf8');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: +(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE \`${DB_NAME}\``);
  console.log('>> Menjalankan restore ...');
  await conn.query(sql);
  await conn.end();
  console.log(`✅ Restore selesai dari ${path.basename(file)}`);
}

run().catch((e) => {
  console.error('❌ Restore gagal:', e.message);
  process.exit(1);
});
