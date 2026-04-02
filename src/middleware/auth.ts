import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../core/errors.js';

/**
 * Placeholder authentication middleware.
 * Replace with your actual auth logic (JWT, session, API key, etc.).
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid Authorization header');
  }

  // TODO: Verify the token and attach user info to request
  // const token = authHeader.slice(7);
  // const user = await verifyToken(token);
  // req.user = user;

  next();
}
