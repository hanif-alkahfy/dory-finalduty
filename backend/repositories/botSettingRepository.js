const pool = require('../config/db');

/**
 * Repository untuk tabel bot_settings.
 */
const botSettingRepository = {
  /**
   * Mengambil nilai setting berdasarkan key.
   * @param {string} key
   * @returns {Promise<string|null>}
   */
  async get(key) {
    const [rows] = await pool.execute(
      "SELECT setting_value FROM bot_settings WHERE setting_key = ?",
      [key]
    );
    return rows.length > 0 ? rows[0].setting_value : null;
  },

  /**
   * Menyimpan atau memperbarui nilai setting.
   * @param {string} key
   * @param {string} value
   * @returns {Promise<void>}
   */
  async set(key, value) {
    await pool.execute(
      "INSERT INTO bot_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
      [key, value, value]
    );
  },
};

module.exports = botSettingRepository;
