const AuthService = require("../services/authService");

const authController = {
  /** POST /auth/login */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email dan password wajib diisi" });
      }
      const token = await AuthService.login(email, password);
      res.status(200).json({ success: true, data: { token } });
    } catch (err) {
      next(err);
    }
  },

  /** PUT /auth/account/email */
  async updateEmail(req, res, next) {
    try {
      const userId = req.user.user_id;
      const { new_email, current_password } = req.body;
      if (!new_email || !current_password) {
        return res.status(400).json({ success: false, message: "new_email dan current_password wajib diisi" });
      }
      await AuthService.updateEmail(userId, new_email, current_password);
      res.status(200).json({ success: true, message: "Email berhasil diperbarui" });
    } catch (err) {
      next(err);
    }
  },

  /** PUT /auth/account/password */
  async updatePassword(req, res, next) {
    try {
      const userId = req.user.user_id;
      const { current_password, new_password } = req.body;
      if (!current_password || !new_password) {
        return res.status(400).json({ success: false, message: "current_password dan new_password wajib diisi" });
      }
      await AuthService.updatePassword(userId, current_password, new_password);
      res.status(200).json({ success: true, message: "Password berhasil diperbarui" });
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /auth/account */
  async deleteAccount(req, res, next) {
    try {
      const userId = req.user.user_id;
      const { current_password } = req.body;
      if (!current_password) {
        return res.status(400).json({ success: false, message: "current_password wajib diisi untuk konfirmasi" });
      }
      await AuthService.deleteAccount(userId, current_password);
      res.status(200).json({ success: true, message: "Akun berhasil dihapus" });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;
