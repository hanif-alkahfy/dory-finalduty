const app = require("./app");
const whatsappClient = require("./config/whatsappClient");
const schedulerService = require("./services/schedulerService");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

// Penanganan error global agar server tidak mati saat auth timeout atau error lainnya
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

async function startServer() {
  try {
    // 1. Inisialisasi WhatsApp Client
    console.log("Memulai inisialisasi WhatsApp...");
    // await di sini untuk menangkap error sinkron saat inisialisasi (seperti browser lock)
    await whatsappClient.initialize();

    // 2. Tunggu hingga status siap (ready)
    // readyPromise akan resolve saat event 'ready' di whatsappClient.js terpicu
    // atau reject jika terjadi auth_failure
    await whatsappClient.readyPromise;

    // 3. Tunggu 10 detik setelah siap
    console.log("WhatsApp siap. Menunggu 10 detik sebelum memulai layanan lain (Scheduler & Express)...");
    await new Promise(resolve => setTimeout(resolve, 10000));

    // 4. Jalankan Reminder Scheduler
    schedulerService.start();

    // 5. Jalankan Express Server
    app.listen(PORT, () => {
      console.log(`Server berjalan di port ${PORT}`);
    });
  } catch (error) {
    console.error("CRITICAL ERROR: Gagal memulai server.");
    console.error("Detail:", error.message);
    console.log("Tips: Jika error berkaitan dengan 'browser is already running', coba tutup semua proses Chromium di Task Manager atau hapus folder .wwebjs_auth");
    process.exit(1);
  }
}

startServer();
