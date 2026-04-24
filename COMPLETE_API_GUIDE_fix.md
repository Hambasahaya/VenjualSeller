# Complete API Guide

Panduan ini merangkum seluruh API yang saat ini aktif di router project ini.

## Base URL

```text
http://localhost:8080
```

Untuk endpoint versi API:

```text
http://localhost:8080/api/v1
```

## Ringkasan Endpoint

| Modul | Jumlah Endpoint | Cocok Untuk |
| --- | ---: | --- |
| Health | 1 | Monitoring service, load balancer, uptime check |
| Users | 9 | Registrasi, login, verifikasi email, profile |
| Payments | 2 | Checkout, cek detail pembayaran |
| Merchants | 6 | Balance, withdrawal, history, summary, WiFi setting |
| Transactions | 3 | Halaman transaksi, monitoring realtime, partner machine report |
| Analytics | 3 | Dashboard analytics, top products, top locations, sales chart |
| Machines | 3 | List mesin, detail mesin, update mesin |
| Channels | 2 | Daftar channel/tray dan update konfigurasi channel |
| Products | 5 | Master product catalog |
| Partner Machine Products | 4 | Product catalog per machine partner |
| Pengajuan Mesin | 6 | Pengajuan mesin dan approval flow |
| Webhook | 1 | Callback DOKU |
| Total | 45 | Seluruh route aktif di project |

## Format Response Umum

Success:

```json
{
  "success": true,
  "data": {},
  "message": "optional"
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "validation_error",
    "message": "validation failed",
    "details": []
  },
  "request_id": "optional-request-id"
}
```

## 1. Health

| Method | Endpoint | Cara Pakai | Cocok Untuk |
| --- | --- | --- | --- |
| `GET` | `/health` | Panggil tanpa body untuk mengecek service hidup | Health check, container readiness, load balancer |

## 2. Users

| Method | Endpoint | Input Utama | Cara Pakai | Cocok Untuk |
| --- | --- | --- | --- | --- |
| `POST` | `/api/v1/users/register` | `username`, `email`, `password`, `full_name`, `phone` | Buat akun user baru | Onboarding user, signup page |
| `POST` | `/api/v1/users/login` | `email`, `password` | Login user dan ambil token | Login form, session bootstrap |
| `POST` | `/api/v1/users/request-verification-email` | `email` | Kirim ulang email verifikasi berisi token | Resend verification, email reminder |
| `POST` | `/api/v1/users/verify-email` | `verify_token` | Verifikasi email via endpoint legacy | Backward compatibility client lama |
| `POST` | `/api/v1/users/verify-email-token` | `token` | Verifikasi email via token/kode | Form input kode, deep link verification |
| `GET` | `/api/v1/users/{user_id}` | Path `user_id` | Ambil profile user | Profile page, session refresh |
| `PATCH` | `/api/v1/users/{user_id}` | `full_name`, `phone`, `address`, `city`, `province`, `avatar_url` | Update profil user | Edit profile |
| `PATCH` | `/api/v1/users/{user_id}/password` | `old_password`, `new_password` | Ganti password (ubah password saat login / reset password setelah verifikasi token) | Security settings, forgot password |
| `POST` | `/api/v1/users/{user_id}/logout` | Path `user_id` | Logout user | Tombol logout |

Contoh register:

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe",
  "phone": "6281234567890"
}
```

Contoh request verification email:

```json
{
  "email": "john@example.com"
}
```

Contoh verify token:

```json
{
  "token": "a1b2c3d4e5f6"
}
```

Flow lupa password (forget password):

1. `POST /api/v1/users/request-verification-email` dengan `email`
2. `POST /api/v1/users/verify-email-token` dengan `token`
3. Jika verifikasi berhasil, arahkan user untuk set password baru lalu panggil:
   - `PATCH /api/v1/users/{user_id}/password` dengan `old_password` diisi token verifikasi dan `new_password` diisi password baru.

## 3. Payments

| Method | Endpoint | Input Utama | Cara Pakai | Cocok Untuk |
| --- | --- | --- | --- | --- |
| `POST` | `/api/v1/payments` | `MerchantID` atau `merchant_id`, `machine_id`, `machine_type_code`, `machine_type_name`, `product_price`, optional `productname`, `callback_url`, `payment_method`, `metadata` | Buat transaksi checkout baru | POS, vending checkout, QR/payment page |
| `GET` | `/api/v1/payments/{id}` | Path `id` | Ambil detail payment berdasarkan ID transaksi | Polling status, detail pembayaran |

Contoh create payment:

```json
{
  "merchant_id": "VMJ001",
  "machine_id": 101,
  "machine_type_code": "VMJ",
  "machine_type_name": "Meja Venjual",
  "product_price": 12000,
  "productname": "Air Mineral",
  "payment_method": "TRANSFER_BANK_VA",
  "metadata": {
    "slot": "A1"
  }
}
```

## 4. Merchants

| Method | Endpoint | Input Utama | Cara Pakai | Cocok Untuk |
| --- | --- | --- | --- | --- |
| `GET` | `/api/v1/merchants/{merchant_id}/balance` | Path `merchant_id` | Ambil balance, pending withdrawal, available balance | Merchant dashboard, wallet card |
| `POST` | `/api/v1/merchants/{merchant_id}/withdrawals` | `amount`, `bank_name`, `bank_account_number`, `bank_account_name`, `notes` | Buat request withdrawal | Cashout page, payout request |
| `PATCH` | `/api/v1/merchants/{merchant_id}/withdrawals/{withdrawal_id}/status` | `status`, optional `rejected_reason` | Proses status withdrawal | Backoffice finance, approval tool |
| `GET` | `/api/v1/merchants/{merchant_id}/history` | Query `limit`, `offset` | Ambil history event merchant | Activity feed, audit trail |
| `GET` | `/api/v1/merchants/{merchant_id}/transaction-summary` | Path `merchant_id` | Ambil ringkasan transaksi merchant | Dashboard KPI merchant |
| `POST` | `/api/v1/merchants/{merchant_id}/wifi-mechine-setting` | `wifi_ssid`, `wifi_password` | Publish setting WiFi ke mesin merchant | Device setup, provisioning mesin |

Contoh request withdrawal:

```json
{
  "amount": 100000,
  "bank_name": "Bank Central Asia",
  "bank_account_number": "1234567890",
  "bank_account_name": "PT Merchant Example",
  "notes": "Withdrawal mingguan"
}
```

Contoh update status withdrawal:

```json
{
  "status": "REJECTED",
  "rejected_reason": "Nama rekening tidak sesuai"
}
```

Contoh publish WiFi:

```json
{
  "wifi_ssid": "Office-WiFi",
  "wifi_password": "super-secret"
}
```

Catatan:

- Status withdrawal yang dipakai: `REQUESTED`, `APPROVED`, `PROCESSING`, `COMPLETED`, `REJECTED`, `FAILED`.
- Saat status menjadi `REJECTED` atau `FAILED`, saldo merchant akan direversal kembali.

## 5. Transactions

| Method | Endpoint | Input Utama | Cara Pakai | Cocok Untuk |
| --- | --- | --- | --- | --- |
| `GET` | `/api/v1/transactions` | Query `partner_id`, `merchant_id`, `machine_id`, `machine_type_code`, `status`, `date_from`, `date_to`, `limit`, `offset` | Ambil daftar transaksi dengan summary, chart, dan tabs | Transaction page, admin reporting |
| `GET` | `/api/v1/transactions/realtime` | Query filter sama seperti list transaksi | Ambil metrik realtime per machine type | Dashboard realtime, TV monitor ops |
| `GET` | `/api/v1/partners/{partner_id}/machines/{machine_id}/transactions` | Path `partner_id`, `machine_id`, optional filter query | Ambil transaksi untuk satu machine milik partner | Partner detail machine report |

Catatan query tanggal:

- `date_from` format `YYYY-MM-DD`
- `date_to` format `YYYY-MM-DD`

Contoh:

```text
GET /api/v1/transactions?merchant_id=VMJ001&status=PAID&date_from=2026-04-01&date_to=2026-04-30&limit=20&offset=0
```

## 6. Analytics

| Method | Endpoint | Input Utama | Cara Pakai | Cocok Untuk |
| --- | --- | --- | --- | --- |
| `GET` | `/api/v1/analytics/top-locations` | Query `merchant_id`, `machine_type_code`, `date_from`, `date_to`, `limit` | Ambil lokasi dengan performa terbaik | Dashboard lokasi terbaik |
| `GET` | `/api/v1/analytics/top-products` | Query `merchant_id`, `machine_type_code`, `date_from`, `date_to`, `limit` | Ambil produk terlaris | Dashboard best seller |
| `GET` | `/api/v1/analytics/daily-sales` | Query `merchant_id`, `machine_type_code`, `date_from`, `date_to` | Ambil time series penjualan harian | Sales chart, trend report |

Contoh:

```text
GET /api/v1/analytics/top-products?merchant_id=VMJ001&machine_type_code=VMJ&date_from=2026-04-01&date_to=2026-04-30&limit=10
```

## 7. Machines

| Method | Endpoint | Input Utama | Cara Pakai | Cocok Untuk |
| --- | --- | --- | --- | --- |
| `GET` | `/api/v1/machines` | Query `q` atau `search`, `status`, `machine_type_code` atau `type`, `partner_id`, `merchant_id`, `include_deleted`, `limit`, `offset` | Ambil daftar mesin | Admin machine list, partner machine dashboard |
| `GET` | `/api/v1/machines/{machine_id}` | Path `machine_id` | Ambil detail satu mesin | Detail mesin, troubleshooting |
| `PATCH` | `/api/v1/machines/{machine_id}` | Field update seperti `name`, `status`, `location`, `wifi_ssid`, `wifi_password`, `partner_id`, `controller_id`, `last_seen_at`, dll | Update data mesin | CMS mesin, operasional lapangan |

Contoh update machine:

```json
{
  "name": "VMJ Plaza Barat",
  "status": "active",
  "wifi_ssid": "Store-WiFi",
  "wifi_password": "store-secret"
}
```

## 8. Channels

| Method | Endpoint | Input Utama | Cara Pakai | Cocok Untuk |
| --- | --- | --- | --- | --- |
| `GET` | `/api/v1/channels` | Query `machine_id`, `merchant_id`, `limit`, `offset` | Ambil daftar channel/tray | Konfigurasi tray, inventory slot |
| `PATCH` | `/api/v1/channels/{id}` | `jenis_mesin` wajib, lalu field seperti `controller_channel_id`, `tray_label`, `function`, `capacity`, `price_now`, `status`, `machine_id`, dll | Update channel/tray mesin | Channel editor, pricing per slot |

Contoh update channel:

```json
{
  "jenis_mesin": "venmachine",
  "controller_channel_id": 7,
  "tray_label": "A1",
  "function": "snack",
  "capacity": 12,
  "price_now": 10000
}
```

## 9. Products

| Method | Endpoint | Input Utama | Cara Pakai | Cocok Untuk |
| --- | --- | --- | --- | --- |
| `POST` | `/api/v1/products` | `code`, `name`, `default_price`, optional `partner_id`, `description`, `category`, `currency`, `image_url`, `status`, dimensi, brand, izin edar | Buat master product | Product catalog management |
| `GET` | `/api/v1/products` | Query `q`, `code`, `category`, `status`, `partner_id`, `machine_id`, `brand`, `include_deleted`, `limit`, `offset` | List master product | Catalog page, admin inventory |
| `GET` | `/api/v1/products/{id}` | Path `id`, optional query `include_deleted=true` | Ambil detail product | Product detail drawer |
| `PATCH` | `/api/v1/products/{id}` | Field product yang ingin diubah | Update product | Edit product |
| `DELETE` | `/api/v1/products/{id}` | Path `id` | Soft delete product | Archive product |

Contoh create product:

```json
{
  "code": "SKU-001",
  "name": "Air Mineral 600ml",
  "default_price": 5000,
  "currency": "IDR",
  "category": "drink",
  "status": "Y"
}
```

## 10. Partner Machine Products

| Method | Endpoint | Input Utama | Cara Pakai | Cocok Untuk |
| --- | --- | --- | --- | --- |
| `GET` | `/api/v1/partners/{partner_id}/machines/{machine_id}/products` | Path `partner_id`, `machine_id`, query filter product | List product untuk machine tertentu | Product assignment per mesin |
| `POST` | `/api/v1/partners/{partner_id}/machines/{machine_id}/products` | Body create product | Buat product sekaligus link ke machine partner | Setup katalog per mesin |
| `PATCH` | `/api/v1/partners/{partner_id}/machines/{machine_id}/products/{id}` | Body update product | Update product yang sudah linked ke machine | Partner machine product editor |
| `DELETE` | `/api/v1/partners/{partner_id}/machines/{machine_id}/products/{id}` | Path params | Hapus product dari machine partner | Cleanup katalog mesin |

## 11. Pengajuan Mesin

| Method | Endpoint | Input Utama | Cara Pakai | Cocok Untuk |
| --- | --- | --- | --- | --- |
| `POST` | `/api/v1/pengajuan-mesin` | `partner_id`, `kategori_mesin`, `lokasi`, optional `deskripsi` | Buat pengajuan mesin baru | Form pengajuan mesin |
| `GET` | `/api/v1/pengajuan-mesin` | Query `kategori_mesin`, `status_pengajuan`, `limit`, `offset` | List semua pengajuan mesin | Admin approval queue |
| `GET` | `/api/v1/pengajuan-mesin/{id}` | Path `id` | Ambil detail satu pengajuan | Detail approval |
| `PATCH` | `/api/v1/pengajuan-mesin/{id}/status` | `status_pengajuan` | Update status pengajuan | Approve/reject workflow |
| `DELETE` | `/api/v1/pengajuan-mesin/{id}` | Path `id` | Hapus pengajuan mesin | Admin cleanup |
| `GET` | `/api/v1/partners/{partner_id}/pengajuan-mesin` | Path `partner_id`, query filter | List pengajuan per partner | Partner self-service dashboard |

Contoh create pengajuan mesin:

```json
{
  "partner_id": "12",
  "kategori_mesin": "vending_machine",
  "lokasi": "Mall ABC lantai 2",
  "deskripsi": "Butuh 1 mesin untuk area food court"
}
```

Contoh update status pengajuan:

```json
{
  "status_pengajuan": "approved"
}
```

## 12. Webhook

| Method | Endpoint | Input Utama | Cara Pakai | Cocok Untuk |
| --- | --- | --- | --- | --- |
| `POST` | `/api/v1/webhook/doku` | Body dari DOKU, signature headers | Dipanggil oleh DOKU saat ada update payment | Provider callback, settlement sync |

Catatan:

- Endpoint ini bukan untuk frontend.
- Signature dan body diverifikasi oleh service.

## Contoh Flow Per Fitur

### A. Signup dan verifikasi email

1. `POST /api/v1/users/register`
2. `POST /api/v1/users/request-verification-email`
3. `POST /api/v1/users/verify-email-token`
4. `POST /api/v1/users/login`

### B. Checkout vending machine

1. `POST /api/v1/payments`
2. `GET /api/v1/payments/{id}`
3. `POST /api/v1/webhook/doku`

### C. Merchant wallet dan withdrawal

1. `GET /api/v1/merchants/{merchant_id}/balance`
2. `POST /api/v1/merchants/{merchant_id}/withdrawals`
3. `PATCH /api/v1/merchants/{merchant_id}/withdrawals/{withdrawal_id}/status`
4. `GET /api/v1/merchants/{merchant_id}/history`

### D. Partner product management

1. `GET /api/v1/products`
2. `POST /api/v1/products`
3. `GET /api/v1/partners/{partner_id}/machines/{machine_id}/products`
4. `POST /api/v1/partners/{partner_id}/machines/{machine_id}/products`

### E. Dashboard analytics

1. `GET /api/v1/transactions`
2. `GET /api/v1/transactions/realtime`
3. `GET /api/v1/analytics/top-products`
4. `GET /api/v1/analytics/top-locations`
5. `GET /api/v1/analytics/daily-sales`

## Endpoint Yang Paling Cocok Per Area Produk

| Area Fitur | Endpoint Utama |
| --- | --- |
| Auth dan onboarding user | `/users/register`, `/users/login`, `/users/request-verification-email`, `/users/verify-email-token` |
| Payment vending | `/payments`, `/payments/{id}`, `/webhook/doku` |
| Merchant wallet | `/merchants/{merchant_id}/balance`, `/merchants/{merchant_id}/withdrawals`, `/merchants/{merchant_id}/history` |
| Finance backoffice | `/merchants/{merchant_id}/withdrawals/{withdrawal_id}/status`, `/transactions`, `/analytics/*` |
| Machine operations | `/machines`, `/machines/{machine_id}`, `/channels/{id}`, `/merchants/{merchant_id}/wifi-mechine-setting` |
| Product catalog | `/products`, `/partners/{partner_id}/machines/{machine_id}/products` |
| Partner machine request | `/pengajuan-mesin`, `/partners/{partner_id}/pengajuan-mesin` |
