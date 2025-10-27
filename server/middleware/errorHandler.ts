import type { Request, Response, NextFunction } from "express";

/**
 * Global error handling middleware
 * Catches all unhandled errors and sends appropriate responses
 */
export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log error details for debugging
  console.error("Unhandled error:", {
    message: err.message,
    stack: err.stack,
    status: err.status || err.statusCode,
    timestamp: new Date().toISOString(),
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === "development";

  // Determine status code (respect error object status, then response status, default to 500)
  const statusCode = err.status || err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  res.status(statusCode).json({
    error: isDevelopment ? err.message : "Internal server error",
    ...(isDevelopment && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
}

/**
 * Async error wrapper to avoid try-catch in every route
 * Usage: router.get('/path', asyncHandler(async (req, res) => {...}))
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
