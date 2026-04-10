const express = require("express");
const messageController = require("../controllers/messageController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Endpoint untuk pengiriman pesan manual.
 * Dasar path: /messages (akan didefinisikan di app.js)
 */

// Semua rute di bawah ini memerlukan autentikasi
router.use(authMiddleware);

router.post("/send", messageController.send);

module.exports = router;
