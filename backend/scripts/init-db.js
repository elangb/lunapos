/* Inisialisasi database: jalankan schema.sql + seed.sql + buat user default.
   Usage: npm run db:init */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: +(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  const schema = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8');
  const seed = fs.readFileSync(path.join(__dirname, '../../database/seed.sql'), 'utf8');

  console.log('>> Menjalankan schema.sql ...');
  await conn.query(schema);
  console.log('>> Schema OK');

  console.log('>> Menjalankan seed.sql ...');
  await conn.query(seed);
  console.log('>> Seed OK');

  // User default (password: password123)
  const users = [
    { username: 'admin', full_name: 'Administrator', role_id: 1, branch_id: null, email: 'admin@lunapos.id' },
    { username: 'pusat', full_name: 'Admin Pusat', role_id: 2, branch_id: null, email: 'pusat@lunapos.id' },
    { username: 'manager', full_name: 'Manager Cabang Jakarta', role_id: 3, branch_id: 1, email: 'manager@lunapos.id' },
    { username: 'kasir1', full_name: 'Kasir Jakarta', role_id: 4, branch_id: 1, email: 'kasir1@lunapos.id' },
    { username: 'kasir2', full_name: 'Kasir Bandung', role_id: 4, branch_id: 2, email: 'kasir2@lunapos.id' },
    { username: 'gudang', full_name: 'Petugas Gudang Jakarta', role_id: 5, branch_id: 1, email: 'gudang@lunapos.id' },
  ];
  const hash = await bcrypt.hash('password123', 10);
  for (const u of users) {
    await conn.query(
      'INSERT INTO lunapos.users (username, email, password_hash, full_name, role_id, branch_id, is_active) VALUES (?,?,?,?,?,?,1) ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)',
      [u.username, u.email, hash, u.full_name, u.role_id, u.branch_id]
    );
    console.log(`   user ${u.username} / password123 (${u.full_name})`);
  }

  // Folder upload
  const uploadDir = path.join(__dirname, '../', process.env.UPLOAD_DIR || 'uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  await conn.end();
  console.log('\n✅ Database lunapos siap. Jalankan: cd backend && npm run dev');
}

run().catch((e) => {
  console.error('❌ Gagal init database:', e.message);
  process.exit(1);
});
