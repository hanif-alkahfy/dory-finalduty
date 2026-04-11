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
 * Cari user berdasarkan id.
 * @param {number} id
 * @returns {Object|null}
 */
async function findById(id) {
  const [rows] = await pool.execute("SELECT * FROM users WHERE id = ?", [id]);
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

/**
 * Update email dan/atau password user.
 * @param {number} id
 * @param {Object} fields - { email?, hashedPassword? }
 * @returns {boolean}
 */
async function update(id, fields) {
  const setClauses = [];
  const values = [];

  if (fields.email !== undefined) {
    setClauses.push("email = ?");
    values.push(fields.email);
  }
  if (fields.hashedPassword !== undefined) {
    setClauses.push("password = ?");
    values.push(fields.hashedPassword);
  }

  if (setClauses.length === 0) return false;

  values.push(id);
  await pool.execute(
    `UPDATE users SET ${setClauses.join(", ")} WHERE id = ?`,
    values
  );
  return true;
}

/**
 * Hapus user berdasarkan id.
 * @param {number} id
 * @returns {boolean}
 */
async function remove(id) {
  const [result] = await pool.execute("DELETE FROM users WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

module.exports = { findByEmail, findById, create, update, remove };
