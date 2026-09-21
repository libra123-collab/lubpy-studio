import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
}

export function centralizedErrorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const status = err.status || err.statusCode || 500;
  const code = err.code || (status === 404 ? 'NOT_FOUND' : status === 400 ? 'BAD_REQUEST' : status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : 'INTERNAL_SERVER_ERROR');
  const message = err.message || 'Có lỗi xảy ra trong quá trình xử lý yêu cầu.';

  console.error(`[API_ERROR] ${req.method} ${req.originalUrl} (${status} - ${code}):`, message);

  // Return standard JSON error response
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}
