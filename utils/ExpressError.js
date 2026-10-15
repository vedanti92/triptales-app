class ExpressError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ExpressError";
    Error.captureStackTrace?.(this, this.constructor);
  }
}

module.exports = ExpressError;
