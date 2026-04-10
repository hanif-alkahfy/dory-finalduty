const WhatsAppClient = require("../config/whatsappClient");
const MessageLogRepository = require("../repositories/messageLogRepository");
const {
  validatePhoneNumber,
  validateRecipientType,
  validateMessage,
} = require("../utils/validators");
const { WhatsAppError } = require("../utils/errors");

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
      await WhatsAppClient.sendMessage(recipient, message, type);

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

      throw new WhatsAppError(502, `Gagal mengirim pesan WhatsApp: ${err.message}`);
    }
  },

  /**
   * Mengirim pesan reminder terjadwal (pembantu untuk Scheduler).
   * @param {Object} reminder
   * @returns {Promise<any>}
   */
  async sendScheduled(reminder) {
    return WhatsAppClient.sendMessage(
      reminder.phone_number,
      reminder.message,
      reminder.recipient_type
    );
  },
};

module.exports = messageService;
