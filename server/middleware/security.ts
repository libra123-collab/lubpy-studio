import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Rate limiter storage for IP / Target
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export interface ExtendedRequest extends Request {
  requestId?: string;
  clientIp?: string;
}

/**
 * Security headers middleware
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  // Generate unique Request ID
  const requestId = crypto.randomUUID();
  res.setHeader('X-Request-Id', requestId);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Custom property for request tracing
  (req as any).requestId = requestId;

  next();
}

/**
 * Simple in-memory rate limiter for sensitive endpoints (Auth, OTP)
 */
export function createRateLimiter(options: { windowMs: number; max: number; message: string }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const key = `${req.path}:${ip}`;
    const now = Date.now();

    const record = rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
      rateLimitMap.set(key, { count: 1, resetTime: now + options.windowMs });
      return next();
    }

    if (record.count >= options.max) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: options.message,
        },
      });
    }

    record.count += 1;
    next();
  };
}

// Cleanup expired rate limit records every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 10 * 60 * 1000);
