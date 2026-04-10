const pool = require("../config/db");

/**
 * Repository untuk tabel reminders.
 */
const reminderRepository = {
  /**
   * Mengambil semua reminder milik user tertentu.
   * @param {number} userId
   * @returns {Promise<Array>}
   */
  async findByUserId(userId) {
    const [rows] = await pool.execute(
      "SELECT * FROM reminders WHERE user_id = ? ORDER BY scheduled_time ASC",
      [userId]
    );
    return rows;
  },

  /**
   * Mengambil satu reminder berdasarkan ID.
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const [rows] = await pool.execute("SELECT * FROM reminders WHERE id = ?", [
      id,
    ]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Membuat reminder baru.
   * @param {Object} data
   * @returns {Promise<Object>} reminder yang baru dibuat
   */
  async create(data) {
    const { user_id, phone_number, message, scheduled_time, recipient_type } =
      data;
    const [result] = await pool.execute(
      "INSERT INTO reminders (user_id, phone_number, message, scheduled_time, recipient_type, status) VALUES (?, ?, ?, ?, ?, 'pending')",
      [user_id, phone_number, message, scheduled_time, recipient_type]
    );
    return { id: result.insertId, ...data, status: "pending" };
  },

  /**
   * Memperbarui data reminder.
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<boolean>}
   */
  async update(id, data) {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await pool.execute(
      `UPDATE reminders SET ${fields.join(", ")} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  },

  /**
   * Menghapus reminder.
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const [result] = await pool.execute("DELETE FROM reminders WHERE id = ?", [
      id,
    ]);
    return result.affectedRows > 0;
  },

  /**
   * Mencari reminder yang berstatus pending dan sudah saatnya dikirim.
   * @param {Date} now
   * @returns {Promise<Array>}
   */
  async findPendingDue(now) {
    const [rows] = await pool.execute(
      "SELECT * FROM reminders WHERE status = 'pending' AND scheduled_time <= ?",
      [now]
    );
    return rows;
  },

  /**
   * Memperbarui status pengiriman reminder.
   * @param {number} id
   * @param {string} status 'sent' atau 'failed'
   * @param {Date|null} sentAt
   */
  async updateStatus(id, status, sentAt = null) {
    await pool.execute("UPDATE reminders SET status = ? WHERE id = ?", [
      status,
      id,
    ]);
  },
};

module.exports = reminderRepository;
