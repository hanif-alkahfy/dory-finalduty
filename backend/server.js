const app = require("./app");
const whatsappClient = require("./config/whatsappClient");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

// Inisialisasi WhatsApp Client
whatsappClient.initialize();

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
