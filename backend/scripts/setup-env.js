/* Setup .env dari .env.example dengan JWT_SECRET acak (96 hex).
   - .env belum ada  -> buat baru dari .env.example
   - .env sudah ada  -> hanya perbarui baris JWT_SECRET, konfigurasi lain tidak disentuh
   Usage: node scripts/setup-env.js [--force]   (--force = paksa regenerate secret) */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envPath = path.join(__dirname, '../.env');
const examplePath = path.join(__dirname, '../.env.example');

function main() {
  const force = process.argv.includes('--force');
  const secret = crypto.randomBytes(48).toString('hex');

  if (fs.existsSync(envPath)) {
    const current = fs.readFileSync(envPath, 'utf8');
    const m = current.match(/^JWT_SECRET=(.*)$/m);
    if (!force && m && m[1] && m[1] !== 'change_this_secret') {
      console.log('✅ .env sudah ada dan JWT_SECRET valid. Tidak ada perubahan.');
      return;
    }
    const updated = current.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${secret}`);
    fs.writeFileSync(envPath, updated);
    console.log(`✅ JWT_SECRET ${m && m[1] ? 'diperbarui' : 'ditambahkan'} di .env (acak, 96 karakter hex)`);
  } else {
    if (!fs.existsSync(examplePath)) {
      console.error('❌ backend/.env.example tidak ditemukan');
      process.exit(1);
    }
    const env = fs.readFileSync(examplePath, 'utf8').replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${secret}`);
    fs.writeFileSync(envPath, env);
    console.log('✅ .env dibuat dari .env.example (JWT_SECRET acak)');
  }
  console.log('⚠️  Wajib: ganti password default (password123) setelah login pertama.');
}

main();
