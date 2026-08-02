# LunaPOS — Point of Sale & Inventory (mirip IQOS 5)

Aplikasi POS + Inventory modern multi-cabang. **React JS + Vite + Tailwind CSS** (frontend), **Node.js + Express + MySQL** (backend). Berjalan di **Laragon** (Windows).

## ✨ Fitur Utama

| Modul | Fitur |
|---|---|
| **Kasir POS** | Scan barcode (keyboard & kamera), cari realtime, qty cepat, edit harga per hak akses, diskon item/transaksi, hold & recall, struk thermal 58mm/80mm, shortcut keyboard (F2/F4/F5/F6/F9/F12) |
| **Pembayaran** | Cash, Transfer, QRIS, Hutang/Piutang (customer wajib + jatuh tempo + bayar sebagian + riwayat) |
| **Promo engine** | Beli 2 Gratis 1, Beli 5 Bayar 4 (BOGO), diskon % — otomatis tambah item FREE ke keranjang; berlaku per produk/kategori/cabang/periode |
| **Barang** | Kode otomatis, barcode EAN-13/CODE128, foto, satuan bertingkat (1 dus = 12 lusin = 144 pcs) dengan konversi stok otomatis, harga beli/retail/grosir/member, stok minimum |
| **Pembelian** | Cash & hutang (termin), diskon item/nota, pajak, ongkir, retur sebagian/penuh dengan penyesuaian stok |
| **Stok** | Mutasi antar cabang + approval manager, stok opname (scan barcode → input fisik → selisih → approval → jurnal), kartu stok saldo berjalan, stok menipis |
| **Kas** | Saldo awal, kas masuk/keluar, setor ke pusat, tarik tunai, shift kasir (buka/tutup, hitung fisik, selisih) |
| **Multi-cabang** | Pusat mengelola semua cabang; kasir hanya melihat cabangnya sendiri; 5 role dengan permission per menu |
| **Laporan** | Hari ini/kemarin/minggu/bulan/tahun/custom; per kasir/cabang/barang/kategori/customer; retail vs grosir; cash vs hutang; umur hutang & piutang (30/60/90+); bulanan & tahunan dengan grafik omzet/laba/transaksi; export CSV |
| **Dashboard** | Omzet & laba hari ini, transaksi, hutang, piutang, stok menipis, grafik 7 hari, 12 bulan, top 10 produk, top 5 cabang |
| **Cetak barcode** | Pilih barang → jumlah label → ukuran (58×25 / 58×40 / 100×50 mm) → preview → cetak massal |

## 🗂 Struktur Folder

```
lunapos/
├── database/
│   ├── schema.sql          # Skema MySQL lengkap (31 tabel + relasi + index)
│   └── seed.sql            # Seed master data (produk, satuan bertingkat, promo, cabang)
├── backend/                # Node.js + Express
│   ├── scripts/
│   │   ├── init-db.js      # Inisialisasi DB + user default (password di-hash)
│   │   └── smoke-test.js   # Tes API end-to-end
│   └── src/
│       ├── config/db.js    # Koneksi MySQL (pool)
│       ├── middleware/     # auth JWT + permission, upload, error handler
│       ├── services/promo.js  # Engine promo BOGO & diskon
│       ├── controllers/    # auth, users, branches, master, products, suppliers,
│       │                   # customers, sales(POS), purchases, stock, cash,
│       │                   # promotions, reports, barcode
│       └── routes/index.js # REST API /api/*
└── frontend/               # React + Vite
    └── src/
        ├── api/            # Axios client + semua endpoint
        ├── stores/         # Zustand: auth, ui (dark mode/sidebar), pos (keranjang)
        ├── components/     # Sidebar, Header, Modal, DataTable (TanStack), dll
        └── pages/          # Login, Dashboard, POS, Barang, Master, Supplier,
                            # Customer, Cabang, User, Penjualan, Pembelian,
                            # Stok, Transfer, Opname, Kas, Promo, Laporan, Barcode
```

## 🚀 Instalasi di Laragon

### 1. Persiapkan Laragon
1. Install [Laragon](https://laragon.org/download/) → Start All (Apache/MySQL).
2. Pastikan MySQL jalan di port `3306` (default Laragon: user `root`, password kosong).
3. Letakkan project di folder Laragon atau lokasi mana pun (jalankan langsung dari sini).

### 2. Inisialisasi Database
```bash
cd backend
npm install
npm run db:init
```
Script ini otomatis:
- Membuat database `lunapos` + 31 tabel (jalankan `database/schema.sql`)
- Mengisi master data demo (jalankan `database/seed.sql`)
- Membuat 6 user demo dengan password `password123`

> Alternatif manual (tanpa Node): buka Laragon → Terminal, lalu:
> ```bash
> "C:\laragon\bin\mysql\mysql-8.*\bin\mysql.exe" -u root < database/schema.sql
> "C:\laragon\bin\mysql\mysql-8.*\bin\mysql.exe" -u root lunapos < database/seed.sql
> ```

### 3. Jalankan Backend
```bash
cd backend
npm run dev          # API di http://localhost:5000
```
Cek: `http://localhost:5000/api/health`

### 4. Jalankan Frontend
```bash
cd frontend
npm install
npm run dev          # Web di http://localhost:5173
```

## � Mode Produksi (Lokal — Siap Jual / Beli Putus)

Frontend di-build lalu disajikan langsung oleh backend di **satu port 5000**. Tidak perlu hosting, tidak perlu Vite dev server.

### Instalasi untuk pembeli (sekali)
1. Install [Node.js LTS](https://nodejs.org) + [Laragon](https://laragon.org) (Start All → MySQL di port 3306)
2. Klik dua kali **`install.bat`** → otomatis: install dependencies, buat `.env` dengan `JWT_SECRET` acak, inisialisasi database + user default, build frontend
3. Klik dua kali **`start.bat`** → browser terbuka di `http://localhost:5000`

### Backup & Restore (wajib rutin)
```bash
npm run backup    # simpan ke backend/backups/, otomatis jaga 10 backup terakhir
npm run restore -- <nama-file.sql>   # timpa seluruh data (minta konfirmasi YES)
```
Atau klik dua kali **`backup.bat`** — hasilnya file SQL di `backend/backups/`. Salin file itu ke flashdisk/cloud sebagai cadangan.

### Checklist sebelum serah terima
- [ ] Ganti password semua user demo (`password123`) via menu Profil / Users
- [ ] `npm run build` lalu `npm start` → cek `http://localhost:5000` jalan di mode produksi
- [ ] `cd backend && node scripts/smoke-test.js` → semua test lulus
- [ ] Backup pertama setelah data toko diisi
- [ ] Lampirkan EULA + manual pengguna + batas dukungan

> `npm run setup` untuk mesin baru (`.env` aman + struktur database). `npm run setup:env` untuk regenerate `JWT_SECRET` saja.

## �🔑 Akun Demo (password: `password123`)

| Username | Role | Cabang |
|---|---|---|
| `admin` | Super Admin | Pusat (semua cabang) |
| `pusat` | Admin Pusat | Pusat |
| `manager` | Manager Cabang | Jakarta |
| `kasir1` | Kasir | Jakarta |
| `kasir2` | Kasir | Bandung |
| `gudang` | Gudang | Jakarta |

## 🧪 Tes Otomatis API

```bash
cd backend
node scripts/smoke-test.js   # login, POS + promo B2G1, hutang, hold, kartu stok, laporan
```

## 🔌 API Utama (prefix `/api`)

```
POST /auth/login, /auth/refresh          GET /auth/me, /auth/change-password
CRUD  /users, /users/:id/permissions     CRUD /branches
CRUD  /categories, /brands, /units
CRUD  /products (+ /generate-barcode, /:id/adjust-stock, /options)
CRUD  /suppliers (+ /:id/debts, /:id/purchases)
CRUD  /customers (+ /:id/receivables, /:id/sales)
POST  /sales (POS + promo)               GET /sales, /sales/:id, POST /sales/:id/void
POST  /sales/hold                        GET /sales/holds, /:id, DELETE
POST  /sales/receivables/:id/pay
POST  /purchases                         POST /purchases/returns
GET   /stock/movements, /stock/card, /stock/low
POST  /stock/transfers, /:id/approve|reject
POST  /stock/opnames, /:id/items, /:id/submit|approve|reject
POST  /cash/shifts/open, /:id/close      POST /cash/transactions
CRUD  /promotions
GET   /reports/dashboard, /sales, /purchases, /cash, /stock, /debts, /monthly
GET   /barcode/labels, /barcode/scan/:code
```

Semua endpoint (kecuali login/refresh) butuh header `Authorization: Bearer <token>`, dengan pagination (`page`, `limit`), pencarian (`search`), dan filter tanggal (`from`, `to`, `period`). Hak akses per menu diverifikasi middleware `requirePerm(menu, action)`.

## 🎨 Desain
- Dominan **putih + biru + abu gelap**, mirip IQOS POS modern
- **Dark mode** toggle (tersimpan)
- **Sidebar collapsible**, responsif desktop kasir & tablet
- Loading skeleton, toast notification, modal modern, animasi halus

## 🖨 Cetak Struk & Label
- Struk thermal: pilih 58mm atau 80mm, barcode invoice CODE-128, tombol Cetak → `window.print()` dengan CSS `@media print` khusus
- Label barcode: 3 ukuran, preview live, cetak massal
