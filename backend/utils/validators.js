const { ValidationError } = require("./errors");

/**
 * Validasi format nomor telepon (628xxx).
 * @param {string} phone
 * @throws {ValidationError} jika format salah
 */
function validatePhoneNumber(phone) {
  const regex = /^628\d{7,12}$/;
  if (!regex.test(phone)) {
    throw new ValidationError(
      400,
      "Format nomor telepon harus diawali 628 diikuti 7-12 digit angka"
    );
  }
}

/**
 * Validasi jenis penerima (phone atau group).
 * @param {string} type
 * @throws {ValidationError} jika nilai tidak valid
 */
function validateRecipientType(type) {
  const validTypes = ["phone", "group"];
  if (!validTypes.includes(type)) {
    throw new ValidationError(
      400,
      "recipient_type harus bernilai 'phone' atau 'group'"
    );
  }
}

/**
 * Validasi isi pesan (1-4096 karakter).
 * @param {string} message
 * @throws {ValidationError} jika kosong atau terlalu panjang
 */
function validateMessage(message) {
  if (!message || message.trim().length === 0) {
    throw new ValidationError(400, "Pesan tidak boleh kosong");
  }
  if (message.length > 4096) {
    throw new ValidationError(400, "Pesan maksimal 4096 karakter");
  }
}

/**
 * Validasi waktu pengiriman (harus > sekarang).
 * @param {string|Date} time
 * @throws {ValidationError} jika waktu di masa lalu
 */
function validateScheduledTime(time) {
  const scheduled = new Date(time);
  if (isNaN(scheduled.getTime())) {
    throw new ValidationError(400, "Format waktu tidak valid");
  }
  if (scheduled <= new Date()) {
    throw new ValidationError(
      400,
      "Waktu pengiriman harus lebih dari waktu sekarang"
    );
  }
}

module.exports = {
  validatePhoneNumber,
  validateRecipientType,
  validateMessage,
  validateScheduledTime,
};
