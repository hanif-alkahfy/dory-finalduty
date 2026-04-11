/**
 * Integration tests untuk endpoint /auth
 * Menggunakan supertest + mock AuthService
 */

jest.mock("../services/authService");
jest.mock("../config/whatsappClient", () => ({
  initialize: jest.fn(),
  readyPromise: Promise.resolve(),
  resolveRecipientName: jest.fn().mockReturnValue(null),
  sendMessage: jest.fn(),
}));

const request = require("supertest");
const app = require("../app");
const AuthService = require("../services/authService");
const { AuthError } = require("../utils/errors");

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = "test_secret";
});

// ─── POST /auth/login ─────────────────────────────────────────────────────

describe("POST /auth/login", () => {
  test("kredensial valid → 200 + token", async () => {
    AuthService.login.mockResolvedValue("mock.jwt.token");

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "admin@test.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBe("mock.jwt.token");
  });

  test("email tidak ada di body → 400", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ password: "password123" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("password tidak ada di body → 400", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "admin@test.com" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("body kosong → 400", async () => {
    const res = await request(app).post("/auth/login").send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("kredensial salah → 401", async () => {
    AuthService.login.mockRejectedValue(
      new AuthError(401, "Email atau password salah")
    );

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "admin@test.com", password: "wrong" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Email atau password salah");
  });
});

// ─── GET /health ──────────────────────────────────────────────────────────

describe("GET /health", () => {
  test("mengembalikan status server running", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
