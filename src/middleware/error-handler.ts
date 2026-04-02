import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../core/errors.js';
import { logger } from '../core/logger.js';
import { env } from '../core/config.js';
import type { ApiErrorResponse } from '../core/types.js';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    logger.warn({ err, path: req.path, method: req.method }, err.message);

    const body: ApiErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.constructor.name === 'ValidationError' &&
          'details' in err && { details: (err as { details: unknown }).details }),
      },
    };

    res.status(err.statusCode).json(body);
    return;
  }

  // Unexpected errors
  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');

  const body: ApiErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    },
  };

  res.status(500).json(body);
}
