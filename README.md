# DoryMind – Final Duty

Aplikasi web untuk mengelola dan mengirim reminder WhatsApp secara otomatis dan manual.

---

## Deskripsi

DoryMind – Final Duty memungkinkan panitia wisuda (admin) untuk:
- Menjadwalkan reminder WhatsApp ke nomor telepon atau grup WhatsApp
- Mengirim pesan manual secara langsung
- Memantau status pengiriman reminder (pending / sent / failed)

Sistem menggunakan scheduler otomatis yang berjalan setiap 1 menit untuk memastikan reminder terkirim tepat waktu.

---

## Tech Stack

| Layer      | Teknologi                        |
|------------|----------------------------------|
| Frontend   | React + Vite + Tailwind CSS      |
| Backend    | Node.js + Express.js             |
| Database   | MySQL                            |
| WhatsApp   | whatsapp-web.js (wwebjs)         |
| Scheduler  | node-cron                        |
| Auth       | JWT + bcrypt                     |
| Tunneling  | Cloudflare Tunnel (cloudflared)  |
| Deploy BE  | Windows Server VPS + PM2         |
| Deploy FE  | Vercel                           |

---

## Struktur Project

```
dorymind-finalduty/
├── backend/
│   ├── config/
│   │   ├── db.js               # Koneksi MySQL (pool)
│   │   ├── schema.sql          # DDL semua tabel
│   │   └── whatsappClient.js   # Inisialisasi wwebjs
│   ├── controllers/            # Handler request HTTP
│   ├── middleware/             # authMiddleware (JWT)
│   ├── repositories/           # Query database
│   ├── routes/                 # Definisi endpoint
│   ├── services/               # Logika bisnis
│   ├── tests/                  # Jest test suite (84 tests)
│   ├── utils/                  # validators.js, errors.js
│   ├── setup.js                # Migrate + seed database (1 perintah)
│   ├── app.js                  # Express app (tanpa listen)
│   ├── server.js               # Entry point server
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/         # StatusBadge, ReminderTable, ReminderForm
│   │   ├── context/            # AuthContext
│   │   ├── pages/              # LoginPage, DashboardPage, ManualMessagePage
│   │   ├── services/           # api.js (Axios + interceptor)
│   │   └── tests/              # Vitest test suite (46 tests)
│   └── .env.example
└── README.md
```

---

## Fitur

- Login admin dengan email & password (JWT 24 jam)
- Dashboard daftar reminder dengan status real-time
- Buat, edit, hapus reminder (tujuan: nomor telepon / grup WhatsApp)
- Kirim pesan manual ke nomor / grup
- Scheduler otomatis kirim reminder setiap 1 menit
- Log status pengiriman (sent / failed)
- Retry otomatis jika pengiriman WhatsApp gagal

---

## API Endpoints

| Method | Endpoint               | Auth | Deskripsi                    |
|--------|------------------------|------|------------------------------|
| POST   | /auth/login            | ✗    | Login admin                  |
| GET    | /reminders             | ✓    | Daftar reminder milik admin  |
| POST   | /reminders             | ✓    | Buat reminder baru           |
| PUT    | /reminders/:id         | ✓    | Edit reminder (pending only) |
| DELETE | /reminders/:id         | ✓    | Hapus reminder               |
| DELETE | /reminders/history/clear | ✓  | Hapus semua riwayat          |
| POST   | /messages/send         | ✓    | Kirim pesan manual           |
| GET    | /health                | ✗    | Health check server          |

---

## Deploy Backend ke Windows Server VPS

### Prasyarat

- Windows Server dengan akses RDP
- Node.js >= 18 ([nodejs.org](https://nodejs.org))
- MySQL 8.x ([dev.mysql.com](https://dev.mysql.com/downloads/installer/))
- Git ([git-scm.com](https://git-scm.com))
- PM2: `npm install -g pm2`
- cloudflared: download dari [developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)

---

### Step 1 — Clone Project

Buka Command Prompt atau PowerShell di VPS:

```bash
git clone https://github.com/hanif-alkahfy/dory-finalduty.git
cd dory-finalduty/backend
```

---

### Step 2 — Install Dependencies

```bash
npm install
```

---

### Step 3 — Konfigurasi Environment

```bash
copy .env.example .env
notepad .env
```

Isi file `.env`:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=password_mysql_kamu
DB_NAME=dorymind
JWT_SECRET=ganti_dengan_string_acak_panjang
ADMIN_EMAIL=admin@dorymind.com
ADMIN_PASSWORD=ganti_password_ini
```

> `ADMIN_EMAIL` dan `ADMIN_PASSWORD` digunakan oleh `setup.js` untuk membuat akun admin pertama.

---

### Step 4 — Setup Database (Migrate + Seed)

Pastikan MySQL sudah berjalan, lalu jalankan:

```bash
npm run setup
```

Output yang diharapkan:

```
=== DoryMind Setup ===
Database: dorymind @ localhost

[1/2] Menjalankan migrasi database...
  ✓ CREATE DATABASE IF NOT EXISTS dorymind...
  ✓ CREATE TABLE IF NOT EXISTS users...
  ✓ CREATE TABLE IF NOT EXISTS reminders...
  ✓ CREATE TABLE IF NOT EXISTS message_logs...
  ✓ CREATE TABLE IF NOT EXISTS bot_settings...
  Migrasi selesai.

[2/2] Menjalankan seeding data awal...
  ✓ Admin dibuat: admin@dorymind.com / admin123
  ⚠  Segera ganti password setelah login pertama!

✅ Setup selesai! Backend siap dijalankan.
```

> Aman dijalankan berulang kali — tabel dan admin tidak akan dibuat duplikat.

---

### Step 5 — Scan QR WhatsApp (Pertama Kali)

Jalankan server sekali secara manual untuk scan QR:

```bash
node server.js
```

Akan muncul QR code di terminal. Scan menggunakan WhatsApp di HP:
- Buka WhatsApp → Perangkat Tertaut → Tautkan Perangkat → Scan QR

Setelah muncul `WhatsApp siap`, tekan `Ctrl+C` untuk stop. Sesi tersimpan otomatis di folder `.wwebjs_auth/`.

---

### Step 6 — Jalankan dengan PM2

```bash
pm2 start server.js --name dorymind-backend
pm2 save
```

Agar PM2 otomatis berjalan saat Windows restart:

```bash
pm2 startup
```

Ikuti instruksi yang muncul (biasanya perlu jalankan satu perintah lagi sebagai Administrator).

Perintah PM2 berguna lainnya:

```bash
pm2 status                        # cek status semua proses
pm2 logs dorymind-backend         # lihat log real-time
pm2 restart dorymind-backend      # restart server
pm2 stop dorymind-backend         # stop server
```

---

### Step 7 — Tunneling API dengan Cloudflare Tunnel (Gratis)

Cloudflare Tunnel mengekspos server lokal ke internet tanpa perlu IP publik atau buka port di firewall.

#### 7a. Login ke Cloudflare

```bash
cloudflared tunnel login
```

Browser akan terbuka. Login ke akun Cloudflare dan pilih domain yang sudah kamu miliki.

#### 7b. Buat Tunnel

```bash
cloudflared tunnel create dorymind-tunnel
```

Catat **Tunnel ID** yang muncul (format UUID).

#### 7c. Buat File Konfigurasi

Buat file `C:\Users\<username>\.cloudflared\config.yml`:

```yaml
tunnel: <TUNNEL_ID_KAMU>
credentials-file: C:\Users\<username>\.cloudflared\<TUNNEL_ID_KAMU>.json

ingress:
  - hostname: api.domain-kamu.com
    service: http://localhost:3000
  - service: http_status:404
```

Ganti:
- `<TUNNEL_ID_KAMU>` dengan Tunnel ID dari langkah 7b
- `<username>` dengan username Windows kamu
- `api.domain-kamu.com` dengan subdomain yang ingin digunakan

#### 7d. Arahkan DNS ke Tunnel

```bash
cloudflared tunnel route dns dorymind-tunnel api.domain-kamu.com
```

#### 7e. Jalankan Tunnel dengan PM2

```bash
pm2 start "cloudflared tunnel run dorymind-tunnel" --name dorymind-tunnel
pm2 save
```

#### 7f. Verifikasi

Buka browser dan akses:

```
https://api.domain-kamu.com/health
```

Response yang diharapkan:

```json
{ "success": true, "message": "Server is running" }
```

---

### Step 8 — Update Frontend

Set environment variable di Vercel dashboard:

```
VITE_API_URL = https://api.domain-kamu.com
```

Lalu redeploy frontend.

---

## Deploy Frontend ke Vercel

1. Push kode ke GitHub (sudah dilakukan)
2. Buka [vercel.com](https://vercel.com) → New Project → Import dari GitHub
3. Set **Root Directory** ke `frontend`
4. Tambahkan environment variable:
   ```
   VITE_API_URL = https://api.domain-kamu.com
   ```
5. Deploy — Vercel otomatis build dan deploy

---

## Menjalankan Lokal (Development)

### Backend

```bash
cd backend
cp .env.example .env
# isi konfigurasi .env
npm install
npm run setup     # migrate + seed database
npm run dev       # nodemon (auto-restart)
```

### Frontend

```bash
cd frontend
cp .env.example .env
# isi VITE_API_URL=http://localhost:3000
npm install
npm run dev
```

---

## Testing

### Backend (Jest — 84 tests)

```bash
cd backend
npm test
```

Cakupan test:
- Unit test: validators, AuthService, ReminderService
- Integration test: semua endpoint API (`/auth`, `/reminders`, `/messages`)

### Frontend (Vitest — 46 tests)

```bash
cd frontend
npm test
```

Cakupan test:
- Routing & ProtectedRoute
- AuthContext (login, logout, persistensi)
- Komponen: StatusBadge, ReminderTable, ReminderForm
- Halaman: LoginPage (validasi, submit, error handling)

---

## Environment Variables

### Backend (`.env`)

| Variable       | Deskripsi                              | Default              |
|----------------|----------------------------------------|----------------------|
| PORT           | Port server Express                    | 3000                 |
| DB_HOST        | Host MySQL                             | localhost            |
| DB_USER        | Username MySQL                         | root                 |
| DB_PASS        | Password MySQL                         | (kosong)             |
| DB_NAME        | Nama database                          | dorymind             |
| JWT_SECRET     | Secret key untuk JWT (wajib diganti)   | -                    |
| ADMIN_EMAIL    | Email admin default (untuk setup.js)   | admin@dorymind.com   |
| ADMIN_PASSWORD | Password admin default (untuk setup.js)| admin123             |

### Frontend (`.env`)

| Variable      | Deskripsi              | Default               |
|---------------|------------------------|-----------------------|
| VITE_API_URL  | URL backend API        | http://localhost:3000 |

---

## Git Workflow

- Branch default: `main`
- Commit setiap selesai 1 task
- Format commit: `feat:`, `fix:`, `chore:`, `docs:`, `test:`

```bash
git remote add origin https://github.com/hanif-alkahfy/dory-finalduty.git
git push -u origin main
```

---

## Lisensi

MIT
