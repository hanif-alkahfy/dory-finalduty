const pool = require("../config/db");

/**
 * Repository untuk tabel message_logs.
 */
const messageLogRepository = {
  /**
   * Membuat log pengiriman pesan baru.
   * @param {Object} data
   * @returns {Promise<number>} insertId
   */
  async create(data) {
    const { phone_number, message, status, sent_at, error_message } = data;
    const [result] = await pool.execute(
      "INSERT INTO message_logs (phone_number, message, status, sent_at, error_message) VALUES (?, ?, ?, ?, ?)",
      [phone_number, message, status, sent_at || null, error_message || null]
    );
    return result.insertId;
  },
};

module.exports = messageLogRepository;
