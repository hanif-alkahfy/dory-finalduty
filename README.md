# DoryMind – Final Duty

Aplikasi web untuk mengelola dan mengirim reminder WhatsApp secara otomatis dan manual untuk rangkaian acara wisuda.

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
| Deploy FE  | Vercel                           |
| Deploy BE  | Windows Server VPS + PM2         |

---

## Struktur Project

```
dorymind-finalduty/
├── backend/          # Express.js API + WhatsApp bot + Scheduler
├── frontend/         # React + Tailwind UI
└── README.md
```

---

## Fitur

- Login admin dengan email & password (JWT)
- Dashboard daftar reminder
- Buat reminder (tujuan: nomor telepon / grup WhatsApp, default: grup)
- Hapus reminder
- Kirim pesan manual ke nomor / grup
- Scheduler otomatis kirim reminder setiap 1 menit
- Log status pengiriman

---

## Cara Menjalankan

### Prasyarat

- Node.js >= 18
- MySQL
- PM2 (untuk production)

### Backend

```bash
cd backend
cp .env.example .env
# isi konfigurasi di .env
npm install
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
# isi VITE_API_URL di .env
npm install
npm run dev
```

### Scan QR WhatsApp

Saat pertama kali menjalankan backend, scan QR code yang muncul di terminal menggunakan WhatsApp untuk menghubungkan sesi bot.

---

## Environment Variables

### Backend (`.env`)

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=dorymind
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h
```

### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:3000
```

---

## Deployment

### Backend (Windows Server VPS)

```bash
npm install -g pm2
pm2 start src/index.js --name dorymind-backend
pm2 save
pm2 startup
```

### Frontend (Vercel)

1. Push ke GitHub
2. Connect repo di [vercel.com](https://vercel.com)
3. Set environment variable `VITE_API_URL` ke URL backend VPS
4. Deploy otomatis setiap push ke `main`

---

## Git Workflow

- Branch default: `main`
- Commit setiap selesai 1 step/task
- Format commit: `feat:`, `fix:`, `chore:`, `docs:`

```bash
git remote add origin https://github.com/hanif-alkahfy/dory-finalduty.git
git push -u origin main
```

---

## Lisensi

MIT
