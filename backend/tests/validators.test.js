/**
 * Unit tests untuk utils/validators.js
 * Mencakup semua fungsi validasi dengan berbagai skenario
 */

const {
  validatePhoneNumber,
  validateRecipientType,
  validateMessage,
  validateScheduledTime,
} = require("../utils/validators");
const { ValidationError } = require("../utils/errors");

// ─── validatePhoneNumber ───────────────────────────────────────────────────

describe("validatePhoneNumber", () => {
  test("menerima nomor valid 628 + 7 digit", () => {
    expect(() => validatePhoneNumber("6281234567")).not.toThrow();
  });

  test("menerima nomor valid 628 + 12 digit", () => {
    expect(() => validatePhoneNumber("628123456789012")).not.toThrow();
  });

  test("menerima nomor valid 628 + 9 digit", () => {
    expect(() => validatePhoneNumber("62812345678")).not.toThrow();
  });

  test("menolak nomor diawali 08", () => {
    expect(() => validatePhoneNumber("081234567890")).toThrow(ValidationError);
  });

  test("menolak nomor diawali +62", () => {
    expect(() => validatePhoneNumber("+6281234567890")).toThrow(ValidationError);
  });

  test("menolak nomor terlalu pendek (628 + 6 digit)", () => {
    expect(() => validatePhoneNumber("628123456")).toThrow(ValidationError);
  });

  test("menolak nomor terlalu panjang (628 + 13 digit)", () => {
    expect(() => validatePhoneNumber("6281234567890123")).toThrow(ValidationError);
  });

  test("menolak string kosong", () => {
    expect(() => validatePhoneNumber("")).toThrow(ValidationError);
  });

  test("menolak nomor dengan huruf", () => {
    expect(() => validatePhoneNumber("628abc1234567")).toThrow(ValidationError);
  });

  test("menolak nomor dengan spasi", () => {
    expect(() => validatePhoneNumber("628 1234 5678")).toThrow(ValidationError);
  });
});

// ─── validateRecipientType ────────────────────────────────────────────────

describe("validateRecipientType", () => {
  test("menerima 'phone'", () => {
    expect(() => validateRecipientType("phone")).not.toThrow();
  });

  test("menerima 'group'", () => {
    expect(() => validateRecipientType("group")).not.toThrow();
  });

  test("menolak 'sms'", () => {
    expect(() => validateRecipientType("sms")).toThrow(ValidationError);
  });

  test("menolak string kosong", () => {
    expect(() => validateRecipientType("")).toThrow(ValidationError);
  });

  test("menolak 'Phone' (case-sensitive)", () => {
    expect(() => validateRecipientType("Phone")).toThrow(ValidationError);
  });

  test("menolak 'GROUP' (case-sensitive)", () => {
    expect(() => validateRecipientType("GROUP")).toThrow(ValidationError);
  });

  test("menolak null", () => {
    expect(() => validateRecipientType(null)).toThrow(ValidationError);
  });
});

// ─── validateMessage ──────────────────────────────────────────────────────

describe("validateMessage", () => {
  test("menerima pesan 1 karakter", () => {
    expect(() => validateMessage("a")).not.toThrow();
  });

  test("menerima pesan 4096 karakter", () => {
    expect(() => validateMessage("a".repeat(4096))).not.toThrow();
  });

  test("menerima pesan normal", () => {
    expect(() => validateMessage("Halo, ini reminder wisuda!")).not.toThrow();
  });

  test("menolak pesan kosong string", () => {
    expect(() => validateMessage("")).toThrow(ValidationError);
  });

  test("menolak pesan hanya spasi", () => {
    expect(() => validateMessage("   ")).toThrow(ValidationError);
  });

  test("menolak pesan 4097 karakter", () => {
    expect(() => validateMessage("a".repeat(4097))).toThrow(ValidationError);
  });

  test("menolak null", () => {
    expect(() => validateMessage(null)).toThrow(ValidationError);
  });

  test("menolak undefined", () => {
    expect(() => validateMessage(undefined)).toThrow(ValidationError);
  });
});

// ─── validateScheduledTime ────────────────────────────────────────────────

describe("validateScheduledTime", () => {
  test("menerima waktu di masa depan", () => {
    const future = new Date(Date.now() + 60 * 60 * 1000); // +1 jam
    expect(() => validateScheduledTime(future.toISOString())).not.toThrow();
  });

  test("menerima waktu jauh di masa depan", () => {
    const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // +1 tahun
    expect(() => validateScheduledTime(future.toISOString())).not.toThrow();
  });

  test("menolak waktu di masa lalu", () => {
    const past = new Date(Date.now() - 60 * 1000); // -1 menit
    expect(() => validateScheduledTime(past.toISOString())).toThrow(ValidationError);
  });

  test("menolak waktu sekarang (sama persis)", () => {
    const now = new Date();
    expect(() => validateScheduledTime(now.toISOString())).toThrow(ValidationError);
  });

  test("menolak string bukan tanggal", () => {
    expect(() => validateScheduledTime("bukan-tanggal")).toThrow(ValidationError);
  });

  test("menolak string kosong", () => {
    expect(() => validateScheduledTime("")).toThrow(ValidationError);
  });
});
