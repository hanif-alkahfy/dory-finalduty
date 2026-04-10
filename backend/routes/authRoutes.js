const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

/**
 * Endpoint untuk login admin.
 * POST /auth/login
 */
router.post("/login", authController.login);

module.exports = router;
