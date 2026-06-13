/**
 * Express Async Handler Wrapper
 * 
 * Catches rejected promises in async middleware/controller routes
 * and forwards them directly to Express's next() error handling route.
 * 
 * @param {Function} fn - Async controller route function
 * @returns {Function} Express middleware handler
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
