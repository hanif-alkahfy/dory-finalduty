const cron = require("node-cron");
const ReminderRepository = require("../repositories/reminderRepository");
const MessageService = require("./messageService");
const MessageLogRepository = require("../repositories/messageLogRepository");

/**
 * Service untuk menjalankan tugas terjadwal (scheduler).
 */
const schedulerService = {
  /**
   * Memulai cron job scheduler.
   */
  start() {
    console.log("Scheduler dimulai: memeriksa reminder setiap menit...");

    // Jalankan setiap menit
    cron.schedule("* * * * *", async () => {
      const now = new Date();
      console.log(`[${now.toISOString()}] Menjalankan pengecekan reminder...`);

      try {
        const pendingReminders = await ReminderRepository.findPendingDue(now);

        if (pendingReminders.length === 0) {
          return;
        }

        console.log(`Menemukan ${pendingReminders.length} reminder yang jatuh tempo.`);

        for (const reminder of pendingReminders) {
          try {
            await MessageService.sendScheduled(reminder);

            // Update status ke 'sent'
            await ReminderRepository.updateStatus(reminder.id, "sent");

            // Catat log sukses
            await MessageLogRepository.create({
              phone_number: reminder.phone_number,
              message: reminder.message,
              status: "sent",
              sent_at: new Date(),
            });

            console.log(`[ID:${reminder.id}] Berhasil dikirim ke ${reminder.phone_number}`);
          } catch (err) {
            const errorTime = new Date().toISOString();
            console.error(`[${errorTime}] [ID:${reminder.id}] Gagal dikirim ke ${reminder.phone_number}: ${err.message}`);

            // Update status ke 'failed'
            await ReminderRepository.updateStatus(reminder.id, "failed");

            // Catat log gagal
            await MessageLogRepository.create({
              phone_number: reminder.phone_number,
              message: reminder.message,
              status: "failed",
              error_message: err.message,
            });
          }
        }
      } catch (err) {
        console.error("Gagal menjalankan tugas scheduler:", err);
      }
    });
  },
};

module.exports = schedulerService;
