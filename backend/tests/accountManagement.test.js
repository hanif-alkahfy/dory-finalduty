/**
 * Tests untuk fitur manage akun admin:
 * - PUT /auth/account/email
 * - PUT /auth/account/password
 * - DELETE /auth/account
 */

jest.mock("../services/authService");
jest.mock("../config/whatsappClient", () => ({
  initialize: jest.fn(),
  readyPromise: Promise.resolve(),
  resolveRecipientName: jest.fn().mockReturnValue(null),
  sendMessage: jest.fn(),
}));

const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../app");
const AuthService = require("../services/authService");
const { AuthError, ValidationError, NotFoundError } = require("../utils/errors");

const JWT_SECRET = "test_secret";
process.env.JWT_SECRET = JWT_SECRET;

const makeToken = (userId = 1) =>
  jwt.sign({ user_id: userId }, JWT_SECRET, { expiresIn: "1h" });

beforeEach(() => jest.clearAllMocks());

// ─── PUT /auth/account/email ──────────────────────────────────────────────

describe("PUT /auth/account/email", () => {
  test("tanpa token → 401", async () => {
    const res = await request(app)
      .put("/auth/account/email")
      .send({ new_email: "baru@test.com", current_password: "pass" });
    expect(res.status).toBe(401);
  });

  test("body tidak lengkap → 400", async () => {
    const res = await request(app)
      .put("/auth/account/email")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ new_email: "baru@test.com" }); // tanpa current_password
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("password saat ini salah → 401", async () => {
    AuthService.updateEmail.mockRejectedValue(
      new AuthError(401, "Password saat ini tidak sesuai")
    );
    const res = await request(app)
      .put("/auth/account/email")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ new_email: "baru@test.com", current_password: "salah" });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Password saat ini tidak sesuai");
  });

  test("email sudah dipakai akun lain → 400", async () => {
    AuthService.updateEmail.mockRejectedValue(
      new ValidationError(400, "Email sudah digunakan oleh akun lain")
    );
    const res = await request(app)
      .put("/auth/account/email")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ new_email: "existing@test.com", current_password: "benar" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Email sudah digunakan oleh akun lain");
  });

  test("berhasil ganti email → 200", async () => {
    AuthService.updateEmail.mockResolvedValue();
    const res = await request(app)
      .put("/auth/account/email")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ new_email: "baru@test.com", current_password: "benar" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Email berhasil diperbarui");
  });

  test("service dipanggil dengan user_id dari token", async () => {
    AuthService.updateEmail.mockResolvedValue();
    await request(app)
      .put("/auth/account/email")
      .set("Authorization", `Bearer ${makeToken(5)}`)
      .send({ new_email: "baru@test.com", current_password: "benar" });
    expect(AuthService.updateEmail).toHaveBeenCalledWith(5, "baru@test.com", "benar");
  });
});

// ─── PUT /auth/account/password ───────────────────────────────────────────

describe("PUT /auth/account/password", () => {
  test("tanpa token → 401", async () => {
    const res = await request(app)
      .put("/auth/account/password")
      .send({ current_password: "lama", new_password: "baru123" });
    expect(res.status).toBe(401);
  });

  test("body tidak lengkap → 400", async () => {
    const res = await request(app)
      .put("/auth/account/password")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ current_password: "lama" }); // tanpa new_password
    expect(res.status).toBe(400);
  });

  test("password saat ini salah → 401", async () => {
    AuthService.updatePassword.mockRejectedValue(
      new AuthError(401, "Password saat ini tidak sesuai")
    );
    const res = await request(app)
      .put("/auth/account/password")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ current_password: "salah", new_password: "baru123" });
    expect(res.status).toBe(401);
  });

  test("password baru terlalu pendek → 400", async () => {
    AuthService.updatePassword.mockRejectedValue(
      new ValidationError(400, "Password baru minimal 6 karakter")
    );
    const res = await request(app)
      .put("/auth/account/password")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ current_password: "benar", new_password: "123" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Password baru minimal 6 karakter");
  });

  test("berhasil ganti password → 200", async () => {
    AuthService.updatePassword.mockResolvedValue();
    const res = await request(app)
      .put("/auth/account/password")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ current_password: "benar", new_password: "baru123" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Password berhasil diperbarui");
  });

  test("service dipanggil dengan user_id dari token", async () => {
    AuthService.updatePassword.mockResolvedValue();
    await request(app)
      .put("/auth/account/password")
      .set("Authorization", `Bearer ${makeToken(3)}`)
      .send({ current_password: "benar", new_password: "baru123" });
    expect(AuthService.updatePassword).toHaveBeenCalledWith(3, "benar", "baru123");
  });
});

// ─── DELETE /auth/account ─────────────────────────────────────────────────

describe("DELETE /auth/account", () => {
  test("tanpa token → 401", async () => {
    const res = await request(app)
      .delete("/auth/account")
      .send({ current_password: "benar" });
    expect(res.status).toBe(401);
  });

  test("tanpa current_password → 400", async () => {
    const res = await request(app)
      .delete("/auth/account")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("current_password wajib diisi untuk konfirmasi");
  });

  test("password salah → 401", async () => {
    AuthService.deleteAccount.mockRejectedValue(
      new AuthError(401, "Password tidak sesuai")
    );
    const res = await request(app)
      .delete("/auth/account")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ current_password: "salah" });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Password tidak sesuai");
  });

  test("akun tidak ditemukan → 404", async () => {
    AuthService.deleteAccount.mockRejectedValue(
      new NotFoundError("Akun tidak ditemukan")
    );
    const res = await request(app)
      .delete("/auth/account")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ current_password: "benar" });
    expect(res.status).toBe(404);
  });

  test("berhasil hapus akun → 200", async () => {
    AuthService.deleteAccount.mockResolvedValue();
    const res = await request(app)
      .delete("/auth/account")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ current_password: "benar" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Akun berhasil dihapus");
  });

  test("service dipanggil dengan user_id dari token", async () => {
    AuthService.deleteAccount.mockResolvedValue();
    await request(app)
      .delete("/auth/account")
      .set("Authorization", `Bearer ${makeToken(7)}`)
      .send({ current_password: "benar" });
    expect(AuthService.deleteAccount).toHaveBeenCalledWith(7, "benar");
  });
});

// ─── Unit test AuthService account management ─────────────────────────────
// Unit tests lengkap ada di authServiceAccount.test.js
