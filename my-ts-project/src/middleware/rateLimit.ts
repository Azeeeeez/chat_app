
import rateLimit from 'express-rate-limit';

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  skipSuccessfulRequests: true,
  max: 10,                    // 10 accounts per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many accounts created from this IP, try again later.' },
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts from this IP, try again later.' },
});

export const accountLockLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 423,
  keyGenerator: (req) => (req.body.username || req.body.email || '').toLowerCase().trim(),
  handler: (_req, res, _next, options) => {
    res.status(options.statusCode).json({
      error: 'Account locked due to too many failed login attempts. Try again in 1 hour.',
      retryAfter: Math.ceil(options.windowMs / 1000)
    });
  },
});