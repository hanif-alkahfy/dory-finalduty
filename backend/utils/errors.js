class AuthError extends Error {
  /**
   * @param {number} status  HTTP status code
   * @param {string} message Human-readable error message
   */
  constructor(status, message) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

module.exports = { AuthError };
