const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

/**
 * Konfigurasi WhatsApp Client dengan strategi LocalAuth.
 * Sesi akan disimpan di folder .wwebjs_auth/
 */
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ["--no-sandbox"],
  },
});

// Event QR Code: Muncul saat pertama kali atau sesi habis
client.on("qr", (qr) => {
  console.log("Scan QR Code di bawah ini untuk login WhatsApp:");
  qrcode.generate(qr, { small: true });
});

// Event Ready: Muncul saat client siap digunakan
client.on("ready", () => {
  console.log("WhatsApp client siap digunakan!");
});

// Event Auth Failure: Muncul jika autentikasi gagal
client.on("auth_failure", (msg) => {
  console.error("Autentikasi WhatsApp gagal:", msg);
});

// Event Disconnected: Muncul saat terputus
client.on("disconnected", (reason) => {
  console.log("WhatsApp terputus:", reason);
});

/**
 * Mengirim pesan WhatsApp.
 * @param {string} recipient nomor telepon atau group_id
 * @param {string} message pesan teks
 * @param {string} recipientType 'phone' atau 'group'
 */
const sendMessage = async (recipient, message, recipientType) => {
  let chatId;
  if (recipientType === "phone") {
    chatId = `${recipient}@c.us`;
  } else {
    chatId = recipient; // group_id as-is
  }

  return client.sendMessage(chatId, message);
};

module.exports = {
  client,
  sendMessage,
  initialize: () => client.initialize(),
};
