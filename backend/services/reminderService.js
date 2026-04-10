const ReminderRepository = require("../repositories/reminderRepository");
const whatsappClient = require("../config/whatsappClient");
const {
  validatePhoneNumber,
  validateRecipientType,
  validateMessage,
  validateScheduledTime,
} = require("../utils/validators");
const {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} = require("../utils/errors");

/**
 * Service untuk logika bisnis reminder.
 */
const reminderService = {
  /**
   * Mengambil daftar reminder admin.
   * @param {number} userId
   * @returns {Promise<Array>}
   */
  async getByUser(userId) {
    const reminders = await ReminderRepository.findByUserId(userId);
    
    // Perkaya data dengan nama grup jika tersedia di cache WhatsApp
    return reminders.map(reminder => {
      let recipientName = null;
      if (reminder.recipient_type === 'group') {
        recipientName = whatsappClient.resolveRecipientName(reminder.phone_number);
      }
      
      return {
        ...reminder,
        recipient_name: recipientName
      };
    });
  },

  /**
   * Membuat reminder baru.
   * @param {Object} data
   * @param {number} userId
   * @returns {Promise<Object>}
   */
  async create(data, userId) {
    const { phone_number, message, scheduled_time, recipient_type } = data;

    // Default recipient_type ke 'group' jika tidak ada
    const type = recipient_type || "group";

    validateRecipientType(type);
    if (type === "phone") {
      validatePhoneNumber(phone_number);
    }
    validateMessage(message);
    validateScheduledTime(scheduled_time);

    return ReminderRepository.create({
      user_id: userId,
      phone_number,
      message,
      scheduled_time: new Date(scheduled_time),
      recipient_type: type,
    });
  },

  /**
   * Memperbarui reminder yang berstatus pending.
   * @param {number} reminderId
   * @param {number} userId
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async update(reminderId, userId, data) {
    const reminder = await ReminderRepository.findById(reminderId);

    if (!reminder) {
      throw new NotFoundError("Reminder tidak ditemukan");
    }

    if (reminder.user_id !== userId) {
      throw new ForbiddenError();
    }

    if (reminder.status !== "pending") {
      throw new ValidationError(
        400,
        "Reminder yang sudah diproses tidak dapat diedit"
      );
    }

    // Validasi field yang dikirimkan
    const updateData = {};
    if (data.recipient_type) {
      validateRecipientType(data.recipient_type);
      updateData.recipient_type = data.recipient_type;
    }

    // Jika recipient_type baru adalah 'phone', atau recipient_type lama adalah 'phone'
    // dan ada phone_number baru
    const finalType = data.recipient_type || reminder.recipient_type;
    if (data.phone_number) {
      if (finalType === "phone") {
        validatePhoneNumber(data.phone_number);
      }
      updateData.phone_number = data.phone_number;
    }

    if (data.message) {
      validateMessage(data.message);
      updateData.message = data.message;
    }

    if (data.scheduled_time) {
      validateScheduledTime(data.scheduled_time);
      updateData.scheduled_time = new Date(data.scheduled_time);
    }

    await ReminderRepository.update(reminderId, updateData);
    return { ...reminder, ...updateData };
  },

  /**
   * Menghapus reminder.
   * @param {number} reminderId
   * @param {number} userId
   * @returns {Promise<boolean>}
   */
  async delete(reminderId, userId) {
    const reminder = await ReminderRepository.findById(reminderId);

    if (!reminder) {
      throw new NotFoundError("Reminder tidak ditemukan");
    }

    if (reminder.user_id !== userId) {
      throw new ForbiddenError();
    }

    // MENGIZINKAN penghapusan reminder yang sudah dikirim (permintaan user)
    // Sebelumnya ada pengecekan status === 'sent' di sini yang memblokir penghapusan.

    return ReminderRepository.delete(reminderId);
  },

  /**
   * Menghapus semua riwayat reminder (sent/failed) milik user.
   * @param {number} userId
   * @returns {Promise<number>}
   */
  async deleteHistory(userId) {
    return ReminderRepository.deleteHistory(userId);
  },
};

module.exports = reminderService;
