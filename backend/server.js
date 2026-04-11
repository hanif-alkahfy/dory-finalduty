const app = require("./app");
const whatsappClient = require("./config/whatsappClient");
const schedulerService = require("./services/schedulerService");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

// ─── Global error handler agar server tidak mati ──────────────────────────
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

// ─── Inisialisasi WhatsApp di background ─────────────────────────────────
// Express dan Scheduler tidak menunggu WhatsApp siap.
// WhatsApp akan siap setelah QR di-scan, dan server tetap berjalan normal.
function initWhatsApp() {
  console.log("[WhatsApp] Memulai inisialisasi...");
  console.log("[WhatsApp] Menunggu QR Code atau sesi tersimpan...");

  whatsappClient.initialize().catch((err) => {
    console.error("[WhatsApp] Gagal initialize:", err.message);
    console.log("[WhatsApp] Tips: Hapus folder .wwebjs_auth/ lalu restart server untuk scan QR ulang.");
  });

  // Pantau status ready secara non-blocking
  whatsappClient.readyPromise
    .then(() => {
      console.log("[WhatsApp] ✓ Siap digunakan. Scheduler dan API aktif.");
    })
    .catch((err) => {
      console.error("[WhatsApp] Auth gagal:", err.message);
      console.log("[WhatsApp] Server tetap berjalan. Restart untuk coba lagi.");
    });
}

// ─── Start server ─────────────────────────────────────────────────────────
async function startServer() {
  // 1. Jalankan Express Server terlebih dahulu
  app.listen(PORT, () => {
    console.log(`[Server] Berjalan di port ${PORT}`);
  });

  // 2. Jalankan Scheduler
  schedulerService.start();
  console.log("[Scheduler] Aktif — memeriksa reminder setiap 1 menit.");

  // 3. Inisialisasi WhatsApp di background (tidak blocking)
  initWhatsApp();
}

startServer();
