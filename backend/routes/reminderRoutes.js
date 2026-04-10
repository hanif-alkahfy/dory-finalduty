const express = require("express");
const reminderController = require("../controllers/reminderController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Endpoint untuk pengelolaan reminder.
 * Dasar path: /reminders (akan didefinisikan di app.js)
 */

// Semua rute di bawah ini memerlukan autentikasi
router.use(authMiddleware);

router.get("/", reminderController.getAll);
router.post("/", reminderController.create);
router.put("/:id", reminderController.update);
router.delete("/:id", reminderController.delete);

module.exports = router;
