const MessageService = require("../services/messageService");

/**
 * Controller untuk menangani pengiriman pesan WhatsApp secara manual.
 */
const messageController = {
  /**
   * Handler untuk mengirim pesan manual.
   * POST /messages/send
   */
  async send(req, res, next) {
    try {
      const { recipient, message, recipient_type } = req.body;

      // Validasi body dasar
      if (!recipient || !message) {
        return res.status(400).json({
          success: false,
          message: "Penerima dan isi pesan wajib diisi",
        });
      }

      const result = await MessageService.sendManual({
        recipient,
        message,
        recipient_type,
      });

      res.status(201).json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = messageController;
