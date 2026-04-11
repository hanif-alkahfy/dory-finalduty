const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const path = require("path");

/**
 * Konfigurasi WhatsApp Client dengan strategi LocalAuth.
 * Sesi akan disimpan di folder .wwebjs_auth/
 */

// Cari Chrome di lokasi umum Windows jika CHROME_PATH tidak di-set
function findChromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;

  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Chromium\\Application\\chrome.exe",
  ];

  const fs = require("fs");
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      console.log(`[WhatsApp] Chrome ditemukan di: ${p}`);
      return p;
    }
  }

  console.log("[WhatsApp] Chrome tidak ditemukan di lokasi default, menggunakan Chromium bundled Puppeteer.");
  return undefined;
}

const chromePath = findChromePath();

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    executablePath: chromePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
      "--single-process",
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

// Event Loading Screen: Puppeteer berhasil launch, sedang load WhatsApp Web
client.on("loading_screen", (percent, message) => {
  if (percent === 0) {
    console.log("[WhatsApp] Browser berhasil launch, memuat WhatsApp Web...");
  }
  if (percent === 100) {
    console.log("[WhatsApp] WhatsApp Web selesai dimuat.");
  }
});

// Event QR Code: Muncul saat pertama kali atau sesi habis
client.on("qr", (qr) => {
  isReady = false;
  console.log("\n[WhatsApp] QR Code siap di-scan:");
  qrcode.generate(qr, { small: true });
  console.log("[WhatsApp] Buka WhatsApp di HP → Perangkat Tertaut → Tautkan Perangkat → Scan QR di atas.");
  console.log("[WhatsApp] Menunggu scan...\n");
});

/**
 * Cache untuk menyimpan nama grup (ID -> Nama)
 */
const groupNameCache = {};

// Event Ready: Muncul saat client siap digunakan
client.on("ready", async () => {
  isReady = true;
  console.log("\n[WhatsApp] ✓ Login berhasil! Client siap digunakan.\n");

  try {
    console.log("[WhatsApp] Mengambil daftar grup untuk cache...");
    const chats = await client.getChats();
    const groups = chats.filter((chat) => chat.isGroup);

    groups.forEach((group) => {
      groupNameCache[group.id._serialized] = group.name;
    });

    if (groups.length > 0) {
      console.log("\n--- DAFTAR GRUP WHATSAPP (DICACHE) ---");
      groups.forEach((group, index) => {
        console.log(`${index + 1}. ${group.name} | ID: ${group.id._serialized}`);
      });
      console.log("--------------------------------------\n");
    } else {
      console.log("[WhatsApp] Tidak ditemukan grup di akun ini.");
    }
  } catch (err) {
    console.error("[WhatsApp] Gagal mengambil daftar grup:", err.message);
  }

  if (readyPromiseResolver) readyPromiseResolver();
});

/**
 * Mencoba mencocokkan ID dengan nama grup yang tersimpan di cache.
 * @param {string} id
 * @returns {string|null}
 */
const resolveRecipientName = (id) => {
  return groupNameCache[id] || null;
};

// Event Auth Failure: Muncul jika autentikasi gagal
client.on("auth_failure", (msg) => {
  isReady = false;
  console.error("[WhatsApp] Autentikasi gagal:", msg);
  console.log("[WhatsApp] Hapus folder .wwebjs_auth/ lalu restart server untuk scan QR ulang.");
  if (readyPromiseRejecter) {
    readyPromiseRejecter(new Error(`Autentikasi gagal: ${msg}`));
  }
});

const MessageLogRepository = require("../repositories/messageLogRepository");
const botService = require("../services/botService");

// Event Disconnected: Muncul saat terputus
client.on("disconnected", (reason) => {
  isReady = false;
  console.log("[WhatsApp] Terputus:", reason);
  console.log("[WhatsApp] Mencoba reconnect otomatis...");
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
  resolveRecipientName,
  initialize: () => client.initialize(),
  isReady: () => isReady,
  readyPromise,
};
