/**
 * @module simpleRateLimit
 * @description Fábrica de middleware de rate limiting simple en memoria.
 */
import { sendError } from '../utils/responseHelper.js';

export const simpleRateLimit = ({ max = 30, windowMs = 60 * 1000 }) => {
  const records = new Map();

  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of records.entries()) {
      const active = timestamps.filter((time) => now - time < windowMs);
      if (active.length === 0) {
        records.delete(key);
      } else {
        records.set(key, active);
      }
    }
  }, Math.max(windowMs, 60000));

  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req, res, next) => {
    const key = (req.user && req.user.id)
      ? `user_${req.user.id}`
      : `ip_${req.ip || req.socket?.remoteAddress || 'unknown'}`;

    const now = Date.now();
    const timestamps = records.get(key) || [];
    const validTimestamps = timestamps.filter((time) => now - time < windowMs);

    if (validTimestamps.length >= max) {
      return sendError(res, 429, 'Demasiadas solicitudes, intenta de nuevo en un momento');
    }

    validTimestamps.push(now);
    records.set(key, validTimestamps);
    next();
  };
};

export default simpleRateLimit;
