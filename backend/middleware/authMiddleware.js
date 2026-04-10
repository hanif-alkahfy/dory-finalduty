const jwt = require("jsonwebtoken");
const { AuthError } = require("../utils/errors");

/**
 * Middleware untuk memvalidasi JWT token.
 * Mengekstrak token dari header Authorization: Bearer <token>.
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthError(401, "Akses ditolak: Token tidak ditemukan");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { user_id: decoded.user_id };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new AuthError(401, "Sesi Anda telah berakhir, silakan login kembali");
    }
    throw new AuthError(401, "Token tidak valid");
  }
};

module.exports = authMiddleware;
