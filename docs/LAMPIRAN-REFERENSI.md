# Lampiran Referensi — LunaPOS (Ringkasan Teknis)

> Lampiran pendukung untuk **Manual Book & Technical Documentation LunaPOS**. Berisi ringkasan arsitektur, endpoint API, dan struktur project dalam format ringkas untuk referensi cepat pengembang.

---

## A. Arsitektur Ringkas

| Lapisan | Teknologi | Port |
|---|---|---|
| Frontend | React 18 + Vite 5 + Tailwind 3 + Zustand | 5173 |
| Backend | Node.js + Express 4 | 5000 |
| Database | MySQL 8 (mysql2 pool, 10 koneksi) | 3306 |
| Auth | JWT (12 jam) + bcryptjs (salt 10) | - |

## B. Endpoint API (Ringkas)

| Metode | Endpoint | Fungsi |
|---|---|---|
| POST | `/auth/login` | Login |
| GET/POST | `/users`, `/users/:id` | Kelola user |
| GET/PUT | `/users/:id/permissions` | Hak akses per role |
| GET/POST | `/branches` | Kelola cabang |
| GET/POST | `/categories`, `/brands`, `/units` | Master data |
| GET/POST | `/products`, `/products/options` | Produk + opsi POS |
| POST | `/products/generate-barcode` | Generate EAN-13/CODE128 |
| GET/POST | `/suppliers`, `/customers` | Pihak terkait |
| POST | `/sales` | Proses transaksi POS |
| POST | `/sales/:id/void` | Batalkan transaksi |
| POST | `/sales/hold`, GET `/sales/holds` | Hold & recall |
| POST | `/purchases` | Pembelian |
| POST | `/purchases/returns` | Retur pembelian |
| GET | `/stock/movements`, `/stock/card`, `/stock/low` | Stok |
| POST | `/stock/transfers`, `/:id/approve` | Transfer antar cabang |
| POST | `/stock/opnames`, `/:id/submit` | Stok opname |
| POST | `/cash/shifts/open`, `/:id/close` | Shift kasir |
| GET/POST | `/cash/transactions` | Transaksi kas |
| GET/POST | `/promotions` | Promo |
| GET | `/reports/dashboard`, `/reports/sales`, dst. | Laporan |
| GET | `/barcode/labels`, `/barcode/scan/:code` | Barcode |

## C. Struktur Project (Ringkas)

```
lunapos/
├── database/            # schema.sql + seed.sql
├── backend/
│   ├── scripts/         # init-db.js, smoke-test.js
│   └── src/
│       ├── config/      # db pool
│       ├── controllers/ # 14 controller
│       ├── middleware/  # auth, errorHandler, upload
│       ├── routes/      # endpoint REST
│       ├── services/    # promo engine
│       └── utils/       # helpers
└── frontend/
    └── src/
        ├── api/         # axios client
        ├── components/  # 10 komponen shared
        ├── pages/       # 19 halaman
        ├── stores/      # auth, pos, ui
        └── utils/       # format, toast, confirm
```

## D. Konfigurasi Lingkungan (`.env` backend)

| Variabel | Default | Keterangan |
|---|---|---|
| PORT | 5000 | Port API |
| DB_HOST | 127.0.0.1 | Host MySQL |
| DB_PORT | 3306 | Port MySQL |
| DB_USER | root | User MySQL |
| DB_PASSWORD | (kosong) | Password MySQL |
| DB_NAME | lunapos | Nama database |
| JWT_SECRET | (wajib diisi) | Secret JWT |
| JWT_EXPIRES_IN | 12h | Masa berlaku token |
| UPLOAD_DIR | uploads | Folder upload |
| MAX_FILE_SIZE | 2097152 (2MB) | Batas upload |

## E. Akun Demo

| Username | Role | Cabang | Password |
|---|---|---|---|
| admin | Super Admin | Pusat | password123 |
| pusat | Admin Pusat | Pusat | password123 |
| manager | Manager Cabang | Jakarta | password123 |
| kasir1 | Kasir | Jakarta | password123 |
| kasir2 | Kasir | Bandung | password123 |
| gudang | Gudang | Jakarta | password123 |

## F. Struktur Response API

```json
{
  "success": true,
  "message": "Login berhasil",
  "data": { },
  "meta": { "page": 1, "limit": 20, "total": 0 }
}
```

## G. Contoh Payload Request

### Login

```json
POST /api/auth/login
{
  "username": "admin",
  "password": "password123"
}
```

### Transaksi POS

```json
POST /api/sales
{
  "items": [
    { "product_id": 1, "unit_id": 1, "qty": 2, "price": 5000 }
  ],
  "payment_method": "cash",
  "total_paid": 10000,
  "tax_rate": 0,
  "trans_discount": 0
}
```

### Pembelian

```json
POST /api/purchases
{
  "supplier_id": 1,
  "items": [
    { "product_id": 1, "unit_id": 1, "qty": 10, "price": 3000 }
  ],
  "payment_method": "debt",
  "due_date": "2026-09-05"
}
```

### Transfer Stok

```json
POST /api/stock/transfers
{
  "to_branch_id": 2,
  "items": [ { "product_id": 1, "qty": 24 } ],
  "note": "Pengisian stok cabang Bandung"
}
```

---

*Referensi ringkas ini melengkapi dokumen utama. Detail lengkap terdapat pada bagian 1-18 Manual Book & Technical Documentation.*
