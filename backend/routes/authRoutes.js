const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Public
router.post("/login", authController.login);

// Protected — manage akun admin
router.put("/account/email",    authMiddleware, authController.updateEmail);
router.put("/account/password", authMiddleware, authController.updatePassword);
router.delete("/account",       authMiddleware, authController.deleteAccount);

module.exports = router;
