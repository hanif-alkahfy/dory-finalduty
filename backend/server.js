const app = require("./app");
const whatsappClient = require("./config/whatsappClient");
const schedulerService = require("./services/schedulerService");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

// Inisialisasi WhatsApp Client
whatsappClient.initialize();

// Jalankan Reminder Scheduler
schedulerService.start();

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
