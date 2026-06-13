/**
 * Custom AppError Class for Centralized Operational Errors
 * 
 * Captures HTTP status codes and classifies errors as operational (expected) 
 * versus developer/programming errors.
 */
class AppError extends Error {
  /**
   * @param {string} message - Error message detail
   * @param {number} statusCode - HTTP status code (e.g. 400, 404, 401)
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
