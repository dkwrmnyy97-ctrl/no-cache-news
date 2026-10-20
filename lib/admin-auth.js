// Bearer-token check shared by admin-only routes.

import { createHash, timingSafeEqual } from 'crypto';

// Constant-time comparison of the presented bearer token against the configured one.
// Both sides are hashed first so differing lengths don't short-circuit.
export function isAuthorizedAdmin(authHeader, expectedToken) {
  if (!expectedToken) return false;
  const match = /^Bearer\s+(.+)$/i.exec(authHeader ?? '');
  if (!match) return false;
  const a = createHash('sha256').update(match[1]).digest();
  const b = createHash('sha256').update(expectedToken).digest();
  return timingSafeEqual(a, b);
}
