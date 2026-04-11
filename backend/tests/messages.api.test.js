/**
 * Integration tests untuk endpoint /messages
 * Menggunakan supertest + mock MessageService + JWT valid
 */

jest.mock("../services/messageService");
jest.mock("../config/whatsappClient", () => ({
  initialize: jest.fn(),
  readyPromise: Promise.resolve(),
  resolveRecipientName: jest.fn().mockReturnValue(null),
  sendMessage: jest.fn(),
}));

const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../app");
const MessageService = require("../services/messageService");
const { ValidationError, WhatsAppError } = require("../utils/errors");

const JWT_SECRET = "test_secret";
process.env.JWT_SECRET = JWT_SECRET;

const makeToken = (userId = 1) =>
  jwt.sign({ user_id: userId }, JWT_SECRET, { expiresIn: "1h" });

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── POST /messages/send ──────────────────────────────────────────────────

describe("POST /messages/send", () => {
  test("tanpa token → 401", async () => {
    const res = await request(app)
      .post("/messages/send")
      .send({ recipient: "120363XXXXXXXXXX@g.us", message: "Halo" });

    expect(res.status).toBe(401);
  });

  test("kirim pesan valid (group) → 201", async () => {
    MessageService.sendManual.mockResolvedValue({ success: true, message: "Pesan berhasil dikirim" });

    const res = await request(app)
      .post("/messages/send")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({
        recipient: "120363XXXXXXXXXX@g.us",
        message: "Halo wisudawan!",
        recipient_type: "group",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  test("kirim pesan valid (phone) → 201", async () => {
    MessageService.sendManual.mockResolvedValue({ success: true, message: "Pesan berhasil dikirim" });

    const res = await request(app)
      .post("/messages/send")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({
        recipient: "6281234567890",
        message: "Halo!",
        recipient_type: "phone",
      });

    expect(res.status).toBe(201);
  });

  test("recipient tidak ada di body → 400", async () => {
    const res = await request(app)
      .post("/messages/send")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ message: "Halo" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("message tidak ada di body → 400", async () => {
    const res = await request(app)
      .post("/messages/send")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ recipient: "120363XXXXXXXXXX@g.us" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("format phone salah (recipient_type=phone) → 400", async () => {
    MessageService.sendManual.mockRejectedValue(
      new ValidationError(400, "Format nomor telepon harus diawali 628 diikuti 7-12 digit angka")
    );

    const res = await request(app)
      .post("/messages/send")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({
        recipient: "08123456789",
        message: "Halo",
        recipient_type: "phone",
      });

    expect(res.status).toBe(400);
  });

  test("WhatsApp gagal kirim → 502", async () => {
    MessageService.sendManual.mockRejectedValue(
      new WhatsAppError(502, "Gagal mengirim pesan WhatsApp setelah beberapa percobaan")
    );

    const res = await request(app)
      .post("/messages/send")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({
        recipient: "120363XXXXXXXXXX@g.us",
        message: "Halo",
        recipient_type: "group",
      });

    expect(res.status).toBe(502);
    expect(res.body.success).toBe(false);
  });

  test("recipient_type tidak valid → 400", async () => {
    MessageService.sendManual.mockRejectedValue(
      new ValidationError(400, "recipient_type harus bernilai 'phone' atau 'group'")
    );

    const res = await request(app)
      .post("/messages/send")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({
        recipient: "120363XXXXXXXXXX@g.us",
        message: "Halo",
        recipient_type: "sms",
      });

    expect(res.status).toBe(400);
  });
});
