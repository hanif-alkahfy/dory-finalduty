const ReminderService = require("../services/reminderService");

/**
 * Controller untuk menangani kelola reminder.
 */
const reminderController = {
  /**
   * Handler untuk mengambil semua reminder milik user.
   * GET /reminders
   */
  async getAll(req, res, next) {
    try {
      const userId = req.user.user_id;
      const reminders = await ReminderService.getByUser(userId);

      res.status(200).json({
        success: true,
        data: reminders,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Handler untuk membuat reminder baru.
   * POST /reminders
   */
  async create(req, res, next) {
    try {
      const userId = req.user.user_id;
      const data = req.body;

      const newReminder = await ReminderService.create(data, userId);

      res.status(201).json({
        success: true,
        data: newReminder,
        message: "Reminder berhasil dibuat",
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Handler untuk memperbarui reminder.
   * PUT /reminders/:id
   */
  async update(req, res, next) {
    try {
      const userId = req.user.user_id;
      const reminderId = parseInt(req.params.id);
      const data = req.body;

      const updatedReminder = await ReminderService.update(
        reminderId,
        userId,
        data
      );

      res.status(200).json({
        success: true,
        data: updatedReminder,
        message: "Reminder berhasil diperbarui",
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Handler untuk menghapus reminder.
   * DELETE /reminders/:id
   */
  async delete(req, res, next) {
    try {
      const userId = req.user.user_id;
      const reminderId = parseInt(req.params.id);

      await ReminderService.delete(reminderId, userId);

      res.status(200).json({
        success: true,
        message: "Reminder berhasil dihapus",
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = reminderController;
