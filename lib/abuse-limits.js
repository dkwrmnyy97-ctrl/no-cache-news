// Abuse limits for routes that trigger paid upstream calls (Claude, OpenAI TTS).
//
// State is in-process. That is correct for this deployment because Railway runs exactly
// one replica (numReplicas: 1); if the service is ever scaled out, these limits become
// per-replica and need a shared store. Counters reset on redeploy/restart, so the hard
// spend ceiling should also be set in the Anthropic/OpenAI consoles.
//
// Client identity is req.ip with `trust proxy` = 2. Railway's edge replaces any client-sent
// X-Forwarded-For with "<client>, <edge>", so req.ip is the real client address; even if a
// spoofed value were passed through, it would sit further left and be ignored.

import { isAuthorizedAdmin } from './admin-auth.js';

// Fixed-window counter keyed by an arbitrary string. Prunes expired windows as it goes.
export function createWindowCounter({ windowMs, max, now = () => Date.now() }) {
  const hits = new Map();
  return {
    take(key) {
      const t = now();
      if (hits.size > 10_000) {
        for (const [k, v] of hits) if (v.reset <= t) hits.delete(k);
      }
      let e = hits.get(key);
      if (!e || e.reset <= t) {
        e = { count: 0, reset: t + windowMs };
        hits.set(key, e);
      }
      if (e.count >= max) return { ok: false, retryAfter: Math.ceil((e.reset - t) / 1000) };
      e.count++;
      return { ok: true };
    },
  };
}

const intEnv = (env, k, d) => {
  const n = Number(env[k]);
  return Number.isInteger(n) && n > 0 ? n : d;
};

// Guard for POST /api/chat. Order matters:
//   1. per-IP limits count every request (including invalid ones), so they can't be farmed
//   2. input validation
//   3. global daily cap + concurrency only for requests that will call Claude
export function createChatGuard({ env = process.env, now = () => Date.now() } = {}) {
  const maxChars = intEnv(env, 'CHAT_MAX_QUERY_CHARS', 500);
  const perMinute = createWindowCounter({ windowMs: 60_000, max: intEnv(env, 'CHAT_PER_IP_PER_MINUTE', 5), now });
  const perDayIp = createWindowCounter({ windowMs: 86_400_000, max: intEnv(env, 'CHAT_PER_IP_PER_DAY', 40), now });
  const perDayAll = createWindowCounter({ windowMs: 86_400_000, max: intEnv(env, 'CHAT_DAILY_CAP', 300), now });
  const maxConcurrent = intEnv(env, 'CHAT_MAX_CONCURRENT', 3);
  let inFlight = 0;

  function middleware(req, res, next) {
    const ip = req.ip || 'unknown';
    for (const limiter of [perMinute, perDayIp]) {
      const r = limiter.take(ip);
      if (!r.ok) {
        res.set('Retry-After', String(r.retryAfter));
        return res.status(429).json({ error: 'You’ve asked a lot of questions in a short time. Please wait a bit and try again.' });
      }
    }

    const query = req.body?.query;
    if (typeof query !== 'string' || !query.trim()) return res.status(400).json({ error: 'Query required' });
    if (query.length > maxChars) return res.status(400).json({ error: `Please keep questions under ${maxChars} characters.` });

    if (inFlight >= maxConcurrent) {
      res.set('Retry-After', '10');
      return res.status(503).json({ error: 'The analyst is busy right now. Please try again in a few seconds.' });
    }
    if (!perDayAll.take('all').ok) {
      return res.status(503).json({ error: 'The analyst has reached today’s question limit. Please try again tomorrow.' });
    }

    inFlight++;
    let released = false;
    const release = () => { if (!released) { released = true; inFlight--; } };
    res.on('finish', release);
    res.on('close', release);
    next();
  }

  return { middleware, inFlight: () => inFlight };
}

// Bearer-token gate for privileged operations (e.g. POST /api/refresh).
// Fails closed (503) when NEWS_ADMIN_TOKEN is not configured.
export function requireNewsAdmin(env = process.env) {
  return (req, res, next) => {
    if (!env.NEWS_ADMIN_TOKEN) return res.status(503).json({ error: 'Admin endpoint is not configured' });
    if (!isAuthorizedAdmin(req.get('authorization'), env.NEWS_ADMIN_TOKEN)) {
      res.set('WWW-Authenticate', 'Bearer');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };
}

// Collapses concurrent cache misses for the same key into one upstream call.
export function createSingleFlight() {
  const pending = new Map();
  return (key, fn) => {
    if (pending.has(key)) return pending.get(key);
    const p = Promise.resolve().then(fn).finally(() => pending.delete(key));
    pending.set(key, p);
    return p;
  };
}
