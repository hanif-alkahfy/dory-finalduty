/**
 * Unit tests untuk services/reminderService.js
 * Menggunakan mock untuk ReminderRepository dan WhatsAppClient
 */

jest.mock("../repositories/reminderRepository");
jest.mock("../config/whatsappClient", () => ({
  resolveRecipientName: jest.fn().mockReturnValue(null),
  sendMessage: jest.fn(),
}));

const ReminderService = require("../services/reminderService");
const ReminderRepository = require("../repositories/reminderRepository");
const { ValidationError, NotFoundError, ForbiddenError } = require("../utils/errors");

beforeEach(() => {
  jest.clearAllMocks();
});

const futureTime = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();

// ─── create ───────────────────────────────────────────────────────────────

describe("ReminderService.create", () => {
  test("membuat reminder valid (group) → status pending", async () => {
    const mockReminder = {
      id: 1,
      user_id: 1,
      phone_number: "120363XXXXXXXXXX@g.us",
      message: "Reminder wisuda",
      scheduled_time: futureTime(),
      status: "pending",
      recipient_type: "group",
    };
    ReminderRepository.create.mockResolvedValue(mockReminder);

    const result = await ReminderService.create(
      {
        phone_number: "120363XXXXXXXXXX@g.us",
        message: "Reminder wisuda",
        scheduled_time: futureTime(),
        recipient_type: "group",
      },
      1
    );

    expect(result.status).toBe("pending");
    expect(ReminderRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 1, recipient_type: "group" })
    );
  });

  test("membuat reminder valid (phone) → diterima", async () => {
    const mockReminder = { id: 2, status: "pending", recipient_type: "phone" };
    ReminderRepository.create.mockResolvedValue(mockReminder);

    const result = await ReminderService.create(
      {
        phone_number: "6281234567890",
        message: "Halo",
        scheduled_time: futureTime(),
        recipient_type: "phone",
      },
      1
    );

    expect(result).toBeDefined();
    expect(ReminderRepository.create).toHaveBeenCalled();
  });

  test("phone_number format salah saat recipient_type=phone → error 400", async () => {
    await expect(
      ReminderService.create(
        {
          phone_number: "08123456789",
          message: "Halo",
          scheduled_time: futureTime(),
          recipient_type: "phone",
        },
        1
      )
    ).rejects.toThrow(ValidationError);
  });

  test("recipient_type tidak valid → error 400", async () => {
    await expect(
      ReminderService.create(
        {
          phone_number: "6281234567890",
          message: "Halo",
          scheduled_time: futureTime(),
          recipient_type: "sms",
        },
        1
      )
    ).rejects.toThrow(ValidationError);
  });

  test("scheduled_time di masa lalu → error 400", async () => {
    const past = new Date(Date.now() - 60000).toISOString();
    await expect(
      ReminderService.create(
        {
          phone_number: "120363XXXXXXXXXX@g.us",
          message: "Halo",
          scheduled_time: past,
          recipient_type: "group",
        },
        1
      )
    ).rejects.toThrow(ValidationError);
  });

  test("pesan kosong → error 400", async () => {
    await expect(
      ReminderService.create(
        {
          phone_number: "120363XXXXXXXXXX@g.us",
          message: "",
          scheduled_time: futureTime(),
          recipient_type: "group",
        },
        1
      )
    ).rejects.toThrow(ValidationError);
  });

  test("pesan > 4096 karakter → error 400", async () => {
    await expect(
      ReminderService.create(
        {
          phone_number: "120363XXXXXXXXXX@g.us",
          message: "a".repeat(4097),
          scheduled_time: futureTime(),
          recipient_type: "group",
        },
        1
      )
    ).rejects.toThrow(ValidationError);
  });

  test("recipient_type default ke 'group' jika tidak disertakan", async () => {
    ReminderRepository.create.mockResolvedValue({ id: 3, status: "pending" });

    await ReminderService.create(
      {
        phone_number: "120363XXXXXXXXXX@g.us",
        message: "Halo",
        scheduled_time: futureTime(),
      },
      1
    );

    expect(ReminderRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ recipient_type: "group" })
    );
  });
});

// ─── update ───────────────────────────────────────────────────────────────

describe("ReminderService.update", () => {
  const pendingReminder = {
    id: 1,
    user_id: 1,
    phone_number: "120363XXXXXXXXXX@g.us",
    message: "Lama",
    scheduled_time: futureTime(),
    status: "pending",
    recipient_type: "group",
  };

  test("edit reminder pending milik sendiri → sukses", async () => {
    ReminderRepository.findById.mockResolvedValue(pendingReminder);
    ReminderRepository.update.mockResolvedValue(true);

    const result = await ReminderService.update(1, 1, { message: "Baru" });

    expect(result.message).toBe("Baru");
    expect(ReminderRepository.update).toHaveBeenCalled();
  });

  test("edit reminder milik orang lain → error 403", async () => {
    ReminderRepository.findById.mockResolvedValue(pendingReminder);

    await expect(ReminderService.update(1, 99, { message: "Baru" }))
      .rejects.toThrow(ForbiddenError);
  });

  test("edit reminder tidak ada → error 404", async () => {
    ReminderRepository.findById.mockResolvedValue(null);

    await expect(ReminderService.update(999, 1, { message: "Baru" }))
      .rejects.toThrow(NotFoundError);
  });

  test("edit reminder status 'sent' → error 400", async () => {
    ReminderRepository.findById.mockResolvedValue({ ...pendingReminder, status: "sent" });

    await expect(ReminderService.update(1, 1, { message: "Baru" }))
      .rejects.toThrow(ValidationError);
  });

  test("edit reminder status 'failed' → error 400", async () => {
    ReminderRepository.findById.mockResolvedValue({ ...pendingReminder, status: "failed" });

    await expect(ReminderService.update(1, 1, { message: "Baru" }))
      .rejects.toThrow(ValidationError);
  });
});

// ─── delete ───────────────────────────────────────────────────────────────

describe("ReminderService.delete", () => {
  const pendingReminder = {
    id: 1,
    user_id: 1,
    status: "pending",
    recipient_type: "group",
  };

  test("hapus reminder milik sendiri → sukses", async () => {
    ReminderRepository.findById.mockResolvedValue(pendingReminder);
    ReminderRepository.delete.mockResolvedValue(true);

    await expect(ReminderService.delete(1, 1)).resolves.toBe(true);
    expect(ReminderRepository.delete).toHaveBeenCalledWith(1);
  });

  test("hapus reminder milik orang lain → error 403", async () => {
    ReminderRepository.findById.mockResolvedValue(pendingReminder);

    await expect(ReminderService.delete(1, 99)).rejects.toThrow(ForbiddenError);
  });

  test("hapus reminder tidak ada → error 404", async () => {
    ReminderRepository.findById.mockResolvedValue(null);

    await expect(ReminderService.delete(999, 1)).rejects.toThrow(NotFoundError);
  });
});
