const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

/**
 * Konfigurasi WhatsApp Client dengan strategi LocalAuth.
 * Sesi akan disimpan di folder .wwebjs_auth/
 */
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    executablePath: process.env.CHROME_PATH || undefined,
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
client.on("ready", async () => {
  isReady = true;
  console.log("WhatsApp client siap digunakan!");

  try {
    console.log("Mengambil daftar grup...");
    const chats = await client.getChats();
    const groups = chats.filter((chat) => chat.isGroup);

    if (groups.length > 0) {
      console.log("\n--- DAFTAR GRUP WHATSAPP ANDA ---");
      groups.forEach((group, index) => {
        console.log(`${index + 1}. Nama: ${group.name} | ID: ${group.id._serialized}`);
      });
      console.log("---------------------------------\n");
    } else {
      console.log("Tidak ditemukan grup di akun WhatsApp ini.");
    }
  } catch (err) {
    console.error("Gagal mengambil daftar grup:", err.message);
  }

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

const MessageLogRepository = require("../repositories/messageLogRepository");
const botService = require("../services/botService");

// Event Disconnected: Muncul saat terputus
client.on("disconnected", (reason) => {
  isReady = false;
  console.log("WhatsApp terputus:", reason);
});

// Event Message Create: Muncul saat ada pesan terkirim maupun masuk (termasuk dari diri sendiri)
client.on("message_create", async (msg) => {
  await botService.handleIntro(client, msg);
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
