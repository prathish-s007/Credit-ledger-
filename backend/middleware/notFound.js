/**
 * 404 Not Found Middleware
 *
 * Catches any request that doesn't match a registered route
 * and forwards a structured error to the central error handler.
 */

const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

export default notFound;
