/**
 * Centralized Error Handler Middleware
 *
 * Catches all errors passed via next(err) in controllers.
 * Normalizes Mongoose errors and returns structured JSON.
 * Stack traces are hidden in production.
 */

const errorHandler = (err, req, res, next) => {
  let statusCode = err.status || err.statusCode || 500;
  let message    = err.message || 'Internal Server Error';
  let errors     = null;

  // ── Mongoose: Bad ObjectId ──────────────────────────────────────────────────
  if (err.name === 'CastError') {
    statusCode = 400;
    message    = `Invalid value for field '${err.path}': ${err.value}`;
  }

  // ── Mongoose: Duplicate Key ─────────────────────────────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message    = field
      ? `An account with this ${field} already exists.`
      : 'Duplicate key error.';
  }

  // ── Mongoose: Validation Error ──────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message    = 'Validation failed. Please check your input.';
    errors     = Object.values(err.errors).map((e) => ({
      field:   e.path,
      message: e.message,
    }));
  }

  // ── JWT: Invalid Token ──────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message    = 'Invalid authentication token. Please log in again.';
  }

  // ── JWT: Expired Token ──────────────────────────────────────────────────────
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message    = 'Session has expired. Please log in again.';
  }

  // ── Log error in development ────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${new Date().toISOString()}] ${statusCode} — ${message}`);
    if (err.stack) console.error(err.stack);
  }

  // ── Send structured response ────────────────────────────────────────────────
  const body = {
    status:  statusCode >= 500 ? 'error' : 'fail',
    message,
  };

  if (errors) body.errors = errors;

  // Attach stack trace only in development mode
  if (process.env.NODE_ENV === 'development' && err.stack) {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
};

export default errorHandler;
