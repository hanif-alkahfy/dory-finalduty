const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserRepository = require("../repositories/userRepository");
const { AuthError, ValidationError, NotFoundError } = require("../utils/errors");

/**
 * Login admin: verifikasi email + password, kembalikan JWT.
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
 */
async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

/**
 * Ganti email admin.
 * @param {number} userId
 * @param {string} newEmail
 * @param {string} currentPassword - wajib konfirmasi password saat ini
 */
async function updateEmail(userId, newEmail, currentPassword) {
  const user = await UserRepository.findById(userId);
  if (!user) throw new NotFoundError("Akun tidak ditemukan");

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) throw new AuthError(401, "Password saat ini tidak sesuai");

  // Cek email baru tidak sudah dipakai akun lain
  const existing = await UserRepository.findByEmail(newEmail);
  if (existing && existing.id !== userId) {
    throw new ValidationError(400, "Email sudah digunakan oleh akun lain");
  }

  await UserRepository.update(userId, { email: newEmail });
}

/**
 * Ganti password admin.
 * @param {number} userId
 * @param {string} currentPassword
 * @param {string} newPassword
 */
async function updatePassword(userId, currentPassword, newPassword) {
  const user = await UserRepository.findById(userId);
  if (!user) throw new NotFoundError("Akun tidak ditemukan");

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) throw new AuthError(401, "Password saat ini tidak sesuai");

  if (newPassword.length < 6) {
    throw new ValidationError(400, "Password baru minimal 6 karakter");
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await UserRepository.update(userId, { hashedPassword: hashed });
}

/**
 * Hapus akun admin.
 * @param {number} userId
 * @param {string} currentPassword - wajib konfirmasi sebelum hapus
 */
async function deleteAccount(userId, currentPassword) {
  const user = await UserRepository.findById(userId);
  if (!user) throw new NotFoundError("Akun tidak ditemukan");

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) throw new AuthError(401, "Password tidak sesuai");

  await UserRepository.remove(userId);
}

module.exports = { login, hashPassword, updateEmail, updatePassword, deleteAccount };
