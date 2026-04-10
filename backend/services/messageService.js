const WhatsAppClient = require("../config/whatsappClient");
const MessageLogRepository = require("../repositories/messageLogRepository");
const {
  validatePhoneNumber,
  validateRecipientType,
  validateMessage,
} = require("../utils/validators");
const { WhatsAppError } = require("../utils/errors");

/**
 * Helper untuk melakukan retry pada fungsi async.
 */
async function withRetry(fn, retries = 2, delay = 3000) {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    console.warn(`[Retry] Terjadi kesalahan: ${err.message}. Mencoba lagi dalam ${delay / 1000}s... (Sisa retry: ${retries})`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay);
  }
}

/**
 * Service untuk logika pengiriman pesan.
 */
const messageService = {
  /**
   * Mengirim pesan secara manual ke nomor atau grup.
   * @param {Object} data
   * @returns {Promise<Object>} hasil pengiriman
   */
  async sendManual(data) {
    const { recipient, message, recipient_type } = data;
    const type = recipient_type || "group";

    // Validasi
    validateRecipientType(type);
    if (type === "phone") {
      validatePhoneNumber(recipient);
    }
    validateMessage(message);

    try {
      // Gunakan retry untuk pengiriman manual juga
      await withRetry(() => WhatsAppClient.sendMessage(recipient, message, type));

      // Catat log sukses
      await MessageLogRepository.create({
        phone_number: recipient,
        message: message,
        status: "sent",
        sent_at: new Date(),
      });

      return { success: true, message: "Pesan berhasil dikirim" };
    } catch (err) {
      // Catat log gagal
      await MessageLogRepository.create({
        phone_number: recipient,
        message: message,
        status: "failed",
        error_message: err.message,
      });

      throw new WhatsAppError(502, `Gagal mengirim pesan WhatsApp setelah beberapa percobaan: ${err.message}`);
    }
  },

  /**
   * Mengirim pesan reminder terjadwal (pembantu untuk Scheduler).
   * @param {Object} reminder
   * @returns {Promise<any>}
   */
  async sendScheduled(reminder) {
    return withRetry(() => 
      WhatsAppClient.sendMessage(
        reminder.phone_number,
        reminder.message,
        reminder.recipient_type
      )
    );
  },
};

module.exports = messageService;
