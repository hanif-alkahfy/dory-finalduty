/**
 * Integration tests untuk endpoint /reminders
 * Menggunakan supertest + mock ReminderService + JWT valid
 */

jest.mock("../services/reminderService");
jest.mock("../config/whatsappClient", () => ({
  initialize: jest.fn(),
  readyPromise: Promise.resolve(),
  resolveRecipientName: jest.fn().mockReturnValue(null),
  sendMessage: jest.fn(),
}));

const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../app");
const ReminderService = require("../services/reminderService");
const { ValidationError, NotFoundError, ForbiddenError } = require("../utils/errors");

const JWT_SECRET = "test_secret";
process.env.JWT_SECRET = JWT_SECRET;

// Helper: buat token valid
const makeToken = (userId = 1) =>
  jwt.sign({ user_id: userId }, JWT_SECRET, { expiresIn: "1h" });

const futureTime = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Auth Guard ───────────────────────────────────────────────────────────

describe("Auth Guard pada /reminders", () => {
  test("tanpa token → 401", async () => {
    const res = await request(app).get("/reminders");
    expect(res.status).toBe(401);
  });

  test("token tidak valid → 401", async () => {
    const res = await request(app)
      .get("/reminders")
      .set("Authorization", "Bearer invalid.token.here");
    expect(res.status).toBe(401);
  });

  test("token expired → 401", async () => {
    const expiredToken = jwt.sign({ user_id: 1 }, JWT_SECRET, { expiresIn: "-1s" });
    const res = await request(app)
      .get("/reminders")
      .set("Authorization", `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });
});

// ─── GET /reminders ───────────────────────────────────────────────────────

describe("GET /reminders", () => {
  test("token valid → 200 + array reminder", async () => {
    const mockReminders = [
      { id: 1, message: "Reminder 1", status: "pending", recipient_type: "group" },
      { id: 2, message: "Reminder 2", status: "sent", recipient_type: "phone" },
    ];
    ReminderService.getByUser.mockResolvedValue(mockReminders);

    const res = await request(app)
      .get("/reminders")
      .set("Authorization", `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });

  test("tidak ada reminder → 200 + array kosong", async () => {
    ReminderService.getByUser.mockResolvedValue([]);

    const res = await request(app)
      .get("/reminders")
      .set("Authorization", `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

// ─── POST /reminders ──────────────────────────────────────────────────────

describe("POST /reminders", () => {
  const validPayload = {
    phone_number: "120363XXXXXXXXXX@g.us",
    message: "Reminder wisuda",
    scheduled_time: futureTime(),
    recipient_type: "group",
  };

  test("data valid → 201 + reminder baru", async () => {
    const mockReminder = { id: 1, ...validPayload, status: "pending" };
    ReminderService.create.mockResolvedValue(mockReminder);

    const res = await request(app)
      .post("/reminders")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("pending");
  });

  test("format phone salah (recipient_type=phone) → 400", async () => {
    ReminderService.create.mockRejectedValue(
      new ValidationError(400, "Format nomor telepon harus diawali 628 diikuti 7-12 digit angka")
    );

    const res = await request(app)
      .post("/reminders")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ ...validPayload, phone_number: "08123456789", recipient_type: "phone" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("scheduled_time di masa lalu → 400", async () => {
    ReminderService.create.mockRejectedValue(
      new ValidationError(400, "Waktu pengiriman harus lebih dari waktu sekarang")
    );

    const res = await request(app)
      .post("/reminders")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ ...validPayload, scheduled_time: "2020-01-01T00:00:00.000Z" });

    expect(res.status).toBe(400);
  });

  test("pesan kosong → 400", async () => {
    ReminderService.create.mockRejectedValue(
      new ValidationError(400, "Pesan tidak boleh kosong")
    );

    const res = await request(app)
      .post("/reminders")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ ...validPayload, message: "" });

    expect(res.status).toBe(400);
  });
});

// ─── PUT /reminders/:id ───────────────────────────────────────────────────

describe("PUT /reminders/:id", () => {
  test("edit reminder pending milik sendiri → 200", async () => {
    const updated = { id: 1, message: "Baru", status: "pending" };
    ReminderService.update.mockResolvedValue(updated);

    const res = await request(app)
      .put("/reminders/1")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ message: "Baru" });

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe("Baru");
  });

  test("edit reminder milik orang lain → 403", async () => {
    ReminderService.update.mockRejectedValue(new ForbiddenError());

    const res = await request(app)
      .put("/reminders/1")
      .set("Authorization", `Bearer ${makeToken(2)}`)
      .send({ message: "Baru" });

    expect(res.status).toBe(403);
  });

  test("edit reminder tidak ada → 404", async () => {
    ReminderService.update.mockRejectedValue(new NotFoundError());

    const res = await request(app)
      .put("/reminders/999")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ message: "Baru" });

    expect(res.status).toBe(404);
  });

  test("edit reminder status sent/failed → 400", async () => {
    ReminderService.update.mockRejectedValue(
      new ValidationError(400, "Reminder yang sudah diproses tidak dapat diedit")
    );

    const res = await request(app)
      .put("/reminders/1")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ message: "Baru" });

    expect(res.status).toBe(400);
  });
});

// ─── DELETE /reminders/:id ────────────────────────────────────────────────

describe("DELETE /reminders/:id", () => {
  test("hapus reminder milik sendiri → 200", async () => {
    ReminderService.delete.mockResolvedValue(true);

    const res = await request(app)
      .delete("/reminders/1")
      .set("Authorization", `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("hapus reminder milik orang lain → 403", async () => {
    ReminderService.delete.mockRejectedValue(new ForbiddenError());

    const res = await request(app)
      .delete("/reminders/1")
      .set("Authorization", `Bearer ${makeToken(2)}`);

    expect(res.status).toBe(403);
  });

  test("hapus reminder tidak ada → 404", async () => {
    ReminderService.delete.mockRejectedValue(new NotFoundError());

    const res = await request(app)
      .delete("/reminders/999")
      .set("Authorization", `Bearer ${makeToken()}`);

    expect(res.status).toBe(404);
  });

  test("ID tidak valid (bukan angka) → 400", async () => {
    const res = await request(app)
      .delete("/reminders/abc")
      .set("Authorization", `Bearer ${makeToken()}`);

    expect(res.status).toBe(400);
  });
});
