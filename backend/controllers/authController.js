const AuthService = require("../services/authService");

/**
 * Controller untuk menangani autentikasi.
 */
const authController = {
  /**
   * Handler untuk login admin.
   * POST /auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Validasi input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email dan password wajib diisi",
        });
      }

      const token = await AuthService.login(email, password);

      res.status(200).json({
        success: true,
        data: { token },
      });
    } catch (err) {
      next(err); // Diteruskan ke global error handler
    }
  },
};

module.exports = authController;
