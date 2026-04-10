class AuthError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

class ValidationError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "ValidationError";
    this.status = status;
  }
}

class NotFoundError extends Error {
  constructor(message = "Resource tidak ditemukan") {
    super(message);
    this.name = "NotFoundError";
    this.status = 404;
  }
}

class ForbiddenError extends Error {
  constructor(message = "Anda tidak memiliki akses ke resource ini") {
    super(message);
    this.name = "ForbiddenError";
    this.status = 403;
  }
}

class WhatsAppError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "WhatsAppError";
    this.status = status;
  }
}

module.exports = {
  AuthError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  WhatsAppError,
};
