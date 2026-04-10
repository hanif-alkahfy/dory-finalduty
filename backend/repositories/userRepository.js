const pool = require("../config/db");

/**
 * Cari user berdasarkan email.
 * @param {string} email
 * @returns {Object|null} row pertama atau null
 */
async function findByEmail(email) {
  const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [
    email,
  ]);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Buat user baru.
 * @param {string} email
 * @param {string} hashedPassword
 * @returns {number} insertId
 */
async function create(email, hashedPassword) {
  const [result] = await pool.execute(
    "INSERT INTO users (email, password) VALUES (?, ?)",
    [email, hashedPassword]
  );
  return result.insertId;
}

module.exports = { findByEmail, create };
