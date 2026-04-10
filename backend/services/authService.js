const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserRepository = require("../repositories/userRepository");
const { AuthError } = require("../utils/errors");

/**
 * Login admin: verifikasi email + password, kembalikan JWT.
 * @param {string} email
 * @param {string} password  plain-text password
 * @returns {string} JWT token (berlaku 24 jam)
 * @throws {AuthError} 401 jika email tidak ditemukan atau password salah
 */
async function login(email, password) {
  const user = await UserRepository.findByEmail(email);
  if (!user) {
    throw new AuthError(401, "Email atau password salah");
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new AuthError(401, "Email atau password salah");
  }

  const token = jwt.sign(
    { user_id: user.id },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );

  return token;
}

/**
 * Hash plain-text password menggunakan bcrypt (salt rounds = 10).
 * @param {string} plain
 * @returns {string} bcrypt hash
 */
async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

module.exports = { login, hashPassword };
