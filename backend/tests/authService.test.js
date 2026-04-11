/**
 * Unit tests untuk services/authService.js
 * Menggunakan mock untuk UserRepository dan bcrypt/jwt
 */

jest.mock("../repositories/userRepository");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

const AuthService = require("../services/authService");
const UserRepository = require("../repositories/userRepository");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { AuthError } = require("../utils/errors");

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = "test_secret_key";
});

// ─── login ────────────────────────────────────────────────────────────────

describe("AuthService.login", () => {
  const mockUser = {
    id: 1,
    email: "admin@test.com",
    password: "$2a$10$hashedpassword",
  };

  test("berhasil login dengan kredensial valid → return token", async () => {
    UserRepository.findByEmail.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue("mock.jwt.token");

    const token = await AuthService.login("admin@test.com", "password123");

    expect(token).toBe("mock.jwt.token");
    expect(UserRepository.findByEmail).toHaveBeenCalledWith("admin@test.com");
    expect(bcrypt.compare).toHaveBeenCalledWith("password123", mockUser.password);
    expect(jwt.sign).toHaveBeenCalledWith(
      { user_id: mockUser.id },
      "test_secret_key",
      { expiresIn: "24h" }
    );
  });

  test("email tidak terdaftar → throw AuthError 401", async () => {
    UserRepository.findByEmail.mockResolvedValue(null);

    await expect(AuthService.login("notfound@test.com", "password123"))
      .rejects.toThrow(AuthError);

    await expect(AuthService.login("notfound@test.com", "password123"))
      .rejects.toMatchObject({ status: 401, message: "Email atau password salah" });
  });

  test("password salah → throw AuthError 401", async () => {
    UserRepository.findByEmail.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(false);

    await expect(AuthService.login("admin@test.com", "wrongpassword"))
      .rejects.toThrow(AuthError);

    await expect(AuthService.login("admin@test.com", "wrongpassword"))
      .rejects.toMatchObject({ status: 401, message: "Email atau password salah" });
  });

  test("pesan error email tidak ditemukan sama dengan password salah (anti user enumeration)", async () => {
    UserRepository.findByEmail.mockResolvedValue(null);
    let errorNotFound;
    try {
      await AuthService.login("notfound@test.com", "pass");
    } catch (e) {
      errorNotFound = e;
    }

    UserRepository.findByEmail.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(false);
    let errorWrongPass;
    try {
      await AuthService.login("admin@test.com", "wrongpass");
    } catch (e) {
      errorWrongPass = e;
    }

    expect(errorNotFound.message).toBe(errorWrongPass.message);
  });

  test("JWT payload memuat user_id", async () => {
    UserRepository.findByEmail.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue("token");

    await AuthService.login("admin@test.com", "password123");

    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: mockUser.id }),
      expect.any(String),
      expect.any(Object)
    );
  });
});

// ─── hashPassword ─────────────────────────────────────────────────────────

describe("AuthService.hashPassword", () => {
  test("memanggil bcrypt.hash dengan salt rounds 10", async () => {
    bcrypt.hash.mockResolvedValue("$2a$10$hashed");

    const result = await AuthService.hashPassword("plainpassword");

    expect(bcrypt.hash).toHaveBeenCalledWith("plainpassword", 10);
    expect(result).toBe("$2a$10$hashed");
  });
});
