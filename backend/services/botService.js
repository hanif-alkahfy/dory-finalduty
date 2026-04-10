const BotSettingRepository = require('../repositories/botSettingRepository');

/**
 * Service untuk menangani logika interaksi bot WhatsApp.
 */
const botService = {
  /**
   * Menangani pesan masuk untuk fitur perkenalan/intro.
   * @param {Object} client instance whatsapp-web.js client
   * @param {Object} msg objek pesan dari event 'message'
   */
  async handleIntro(client, msg) {
    const TARGET_GROUP_ID = '120363336442316101@g.us';
    const INTRO_SETTING_KEY = `intro_sent_${TARGET_GROUP_ID}`;
    const botId = client.info.wid._serialized;

    // DEBUG LOG
    const body = msg.body ? msg.body.toLowerCase() : "";
    console.log(`[BotService Debug] --- PESAN BARU ---`);
    console.log(`[BotService Debug] Group ID: ${msg.from}`);
    console.log(`[BotService Debug] Bot ID (Serialized): ${botId}`);
    console.log(`[BotService Debug] Isi Pesan: ${body}`);
    console.log(`[BotService Debug] Mentioned IDs: ${JSON.stringify(msg.mentionedIds)}`);

    // 1. Filter Case: Harus di grup target
    if (msg.from !== TARGET_GROUP_ID) {
      return;
    }

    // 2. Filter Trigger: Harus tag bot DAN mengandung "hi dory"
    const botNumber = botId.split('@')[0];

    // Deteksi lebih fleksibel:
    // - Mention resmi dari library
    // - Ada @nomor di dalam teks
    // - Atau cukup ada kata "hi dory" dan ada mention apapun (biasanya bot)
    const hasTagPattern = new RegExp(`@${botNumber}`).test(body);
    const mentionsAny = msg.mentionedIds.length > 0;
    const isNamedDory = body.includes('dory');

    const isMentioned = msg.mentionedIds.includes(botId) || hasTagPattern || (mentionsAny && isNamedDory);

    console.log(`[BotService Debug] Bot: ${botNumber} | isMentioned: ${isMentioned} | Body: ${body}`);

    if (body.includes('hi dory') && isMentioned) {
      try {
        // 3. Cek Status di Database: Apakah sudah pernah kirim?
        const alreadySent = await BotSettingRepository.get(INTRO_SETTING_KEY);

        if (alreadySent === '1') {
          console.log(`[BotService] Intro sudah pernah dikirim sebelumnya untuk grup ${TARGET_GROUP_ID}.`);
          return;
        }

        // 4. Kirim Respon
        const response = "Hi, I’m Dory. I will carry out my final duty as your personal reminder.";
        await client.sendMessage(TARGET_GROUP_ID, response);

        // 5. Simpan Status ke Database
        await BotSettingRepository.set(INTRO_SETTING_KEY, '1');

        console.log(`[BotService] Berhasil mengirim pesan intro dan menyimpan status ke database.`);
      } catch (err) {
        console.error(`[BotService] Gagal menangani intro:`, err.message);
      }
    }
  }
};

module.exports = botService;
