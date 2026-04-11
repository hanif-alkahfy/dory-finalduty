/**
 * Unit tests untuk AuthService — fitur manage akun:
 * updateEmail, updatePassword, deleteAccount
 */

jest.mock("../repositories/userRepository");
jest.mock("bcryptjs");

const AuthService = require("../services/authService");
const UserRepository = require("../repositories/userRepository");
const bcrypt = require("bcryptjs");
const { AuthError, ValidationError, NotFoundError } = require("../utils/errors");

const mockUser = {
  id: 1,
  email: "admin@test.com",
  password: "$2a$10$hashedpassword",
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = "test_secret";
});

// ─── updateEmail ──────────────────────────────────────────────────────────

describe("AuthService.updateEmail", () => {
  test("berhasil ganti email", async () => {
    UserRepository.findById.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    UserRepository.findByEmail.mockResolvedValue(null); // email belum dipakai
    UserRepository.update.mockResolvedValue(true);

    await expect(
      AuthService.updateEmail(1, "baru@test.com", "password123")
    ).resolves.toBeUndefined();

    expect(UserRepository.update).toHaveBeenCalledWith(1, { email: "baru@test.com" });
  });

  test("akun tidak ditemukan → NotFoundError", async () => {
    UserRepository.findById.mockResolvedValue(null);

    await expect(AuthService.updateEmail(99, "baru@test.com", "pass"))
      .rejects.toThrow(NotFoundError);
  });

  test("password saat ini salah → AuthError 401", async () => {
    UserRepository.findById.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(false);

    await expect(AuthService.updateEmail(1, "baru@test.com", "salah"))
      .rejects.toThrow(AuthError);

    await expect(AuthService.updateEmail(1, "baru@test.com", "salah"))
      .rejects.toMatchObject({ status: 401 });
  });

  test("email sudah dipakai akun lain → ValidationError 400", async () => {
    UserRepository.findById.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    UserRepository.findByEmail.mockResolvedValue({ id: 99, email: "existing@test.com" });

    await expect(AuthService.updateEmail(1, "existing@test.com", "benar"))
      .rejects.toThrow(ValidationError);
  });

  test("email sama dengan milik sendiri → tidak error (update tetap jalan)", async () => {
    UserRepository.findById.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    // findByEmail mengembalikan user yang sama (id sama)
    UserRepository.findByEmail.mockResolvedValue(mockUser);
    UserRepository.update.mockResolvedValue(true);

    await expect(
      AuthService.updateEmail(1, "admin@test.com", "benar")
    ).resolves.toBeUndefined();
  });
});

// ─── updatePassword ───────────────────────────────────────────────────────

describe("AuthService.updatePassword", () => {
  test("berhasil ganti password", async () => {
    UserRepository.findById.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    bcrypt.hash.mockResolvedValue("$2a$10$newhash");
    UserRepository.update.mockResolvedValue(true);

    await expect(
      AuthService.updatePassword(1, "lama123", "baru123456")
    ).resolves.toBeUndefined();

    expect(bcrypt.hash).toHaveBeenCalledWith("baru123456", 10);
    expect(UserRepository.update).toHaveBeenCalledWith(1, { hashedPassword: "$2a$10$newhash" });
  });

  test("akun tidak ditemukan → NotFoundError", async () => {
    UserRepository.findById.mockResolvedValue(null);

    await expect(AuthService.updatePassword(99, "lama", "baru123"))
      .rejects.toThrow(NotFoundError);
  });

  test("password saat ini salah → AuthError 401", async () => {
    UserRepository.findById.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(false);

    await expect(AuthService.updatePassword(1, "salah", "baru123"))
      .rejects.toThrow(AuthError);
  });

  test("password baru < 6 karakter → ValidationError 400", async () => {
    UserRepository.findById.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);

    await expect(AuthService.updatePassword(1, "benar", "123"))
      .rejects.toThrow(ValidationError);

    await expect(AuthService.updatePassword(1, "benar", "123"))
      .rejects.toMatchObject({ status: 400, message: "Password baru minimal 6 karakter" });
  });

  test("password baru tepat 6 karakter → diterima", async () => {
    UserRepository.findById.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    bcrypt.hash.mockResolvedValue("$2a$10$newhash");
    UserRepository.update.mockResolvedValue(true);

    await expect(
      AuthService.updatePassword(1, "benar", "123456")
    ).resolves.toBeUndefined();
  });
});

// ─── deleteAccount ────────────────────────────────────────────────────────

describe("AuthService.deleteAccount", () => {
  test("berhasil hapus akun", async () => {
    UserRepository.findById.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    UserRepository.remove.mockResolvedValue(true);

    await expect(AuthService.deleteAccount(1, "benar")).resolves.toBeUndefined();
    expect(UserRepository.remove).toHaveBeenCalledWith(1);
  });

  test("akun tidak ditemukan → NotFoundError", async () => {
    UserRepository.findById.mockResolvedValue(null);

    await expect(AuthService.deleteAccount(99, "benar"))
      .rejects.toThrow(NotFoundError);
  });

  test("password salah → AuthError 401", async () => {
    UserRepository.findById.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(false);

    await expect(AuthService.deleteAccount(1, "salah"))
      .rejects.toThrow(AuthError);

    await expect(AuthService.deleteAccount(1, "salah"))
      .rejects.toMatchObject({ status: 401, message: "Password tidak sesuai" });
  });

  test("remove tidak dipanggil jika password salah", async () => {
    UserRepository.findById.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(false);

    try { await AuthService.deleteAccount(1, "salah"); } catch {}
    expect(UserRepository.remove).not.toHaveBeenCalled();
  });
});
