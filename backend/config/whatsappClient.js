const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

/**
 * Konfigurasi WhatsApp Client dengan strategi LocalAuth.
 * Sesi akan disimpan di folder .wwebjs_auth/
 */
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
    ],
  },
});

/**
 * State untuk melacak kesiapan WhatsApp Client.
 */
let isReady = false;
let readyPromiseResolver;
let readyPromiseRejecter;
const readyPromise = new Promise((resolve, reject) => {
  readyPromiseResolver = resolve;
  readyPromiseRejecter = reject;
});

// Event QR Code: Muncul saat pertama kali atau sesi habis
client.on("qr", (qr) => {
  isReady = false;
  console.log("Scan QR Code di bawah ini untuk login WhatsApp:");
  qrcode.generate(qr, { small: true });
});

// Event Ready: Muncul saat client siap digunakan
client.on("ready", () => {
  isReady = true;
  console.log("WhatsApp client siap digunakan!");
  if (readyPromiseResolver) readyPromiseResolver();
});

// Event Auth Failure: Muncul jika autentikasi gagal
client.on("auth_failure", (msg) => {
  isReady = false;
  console.error("Autentikasi WhatsApp gagal:", msg);
  if (readyPromiseRejecter) {
    readyPromiseRejecter(new Error(`Autentikasi gagal: ${msg}`));
  }
});

// Event Disconnected: Muncul saat terputus
client.on("disconnected", (reason) => {
  isReady = false;
  console.log("WhatsApp terputus:", reason);
});

/**
 * Mengirim pesan WhatsApp.
 * @param {string} recipient nomor telepon atau group_id
 * @param {string} message pesan teks
 * @param {string} recipientType 'phone' atau 'group'
 */
const sendMessage = async (recipient, message, recipientType) => {
  if (!isReady) {
    throw new Error("WhatsApp client belum siap atau belum login (Scan QR Code di server).");
  }

  // Cek apakah pupPage tersedia (menghindari error 'getChat' undefined saat reresh/reconnect)
  if (!client.pupPage || client.pupPage.isClosed()) {
    isReady = false; // Reset status jika browser ternyata tertutup/crash
    throw new Error("WhatsApp connection lost: Browser page is not available. Please wait for reconnection.");
  }

  let chatId;
  if (recipientType === "phone") {
    // Pastikan nomor dibersihkan dari karakter non-digit
    const cleanNumber = recipient.toString().replace(/\D/g, "");
    chatId = `${cleanNumber}@c.us`;
  } else {
    chatId = recipient; // group_id as-is
  }

  console.log(`[WhatsApp] Mengirim pesan ke ${chatId}...`);
  return client.sendMessage(chatId, message);
};

module.exports = {
  client,
  sendMessage,
  initialize: () => client.initialize(),
  isReady: () => isReady,
  readyPromise,
};
