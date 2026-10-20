// Abuse limits for paid routes. Upstream (Claude) is a counting stub: no network calls.
// Run: node --test tests/abuse-limits.test.js

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createChatGuard, requireNewsAdmin, createSingleFlight, createWindowCounter } from '../lib/abuse-limits.js';

// Mirrors server.js: trust proxy 1, JSON body limit, guard in front of a paid handler.
async function startApp({ env = {}, upstreamDelayMs = 0 } = {}) {
  const app = express();
  app.set('trust proxy', 2);
  app.use(express.json({ limit: '16kb' }));
  const guard = createChatGuard({ env });
  let paidCalls = 0;
  app.post('/api/chat', guard.middleware, async (req, res) => {
    paidCalls++;
    await new Promise((r) => setTimeout(r, upstreamDelayMs));
    res.json({ summary: 'ok' });
  });
  let flushes = 0;
  app.post('/api/refresh', requireNewsAdmin(env), (req, res) => { flushes++; res.json({ ok: true }); });
  const server = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  return { base, server, paid: () => paidCalls, flushes: () => flushes };
}

// Measured on Railway: X-Forwarded-For arrives as "<client>, <edge>", and the edge address
// varies between requests. A spoofed value (if it ever got through) would sit further left.
let edge = 0;
const chat = (base, query, { realIp = '198.51.100.1', spoof } = {}) => fetch(`${base}/api/chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Forwarded-For': `${spoof ? `${spoof}, ` : ''}${realIp}, 152.233.47.${60 + (edge++ % 10)}`,
  },
  body: JSON.stringify({ query }),
});

describe('chat: normal use', () => {
  test('a normal question reaches the paid handler', async () => {
    const ctx = await startApp();
    try {
      const res = await chat(ctx.base, 'What happened with AI regulation this week?');
      assert.equal(res.status, 200);
      assert.equal(ctx.paid(), 1);
    } finally { ctx.server.close(); }
  });
});

describe('chat: per-IP limits', () => {
  test('6th request in a minute → 429 with Retry-After; paid handler not called', async () => {
    const ctx = await startApp();
    try {
      for (let i = 0; i < 5; i++) assert.equal((await chat(ctx.base, `q${i}`)).status, 200);
      const res = await chat(ctx.base, 'q6');
      assert.equal(res.status, 429);
      assert.ok(Number(res.headers.get('retry-after')) > 0);
      assert.equal(ctx.paid(), 5);
    } finally { ctx.server.close(); }
  });

  test('spoofed X-Forwarded-For entries do not create new identities', async () => {
    const ctx = await startApp();
    try {
      for (let i = 0; i < 5; i++) await chat(ctx.base, `q${i}`, { spoof: `10.0.0.${i}` });
      assert.equal((await chat(ctx.base, 'q', { spoof: '10.9.9.9' })).status, 429);
      assert.equal(ctx.paid(), 5);
    } finally { ctx.server.close(); }
  });

  test('invalid requests still count, so the limit cannot be farmed for free', async () => {
    const ctx = await startApp();
    try {
      for (let i = 0; i < 5; i++) assert.equal((await chat(ctx.base, '')).status, 400);
      assert.equal((await chat(ctx.base, 'real question')).status, 429);
      assert.equal(ctx.paid(), 0);
    } finally { ctx.server.close(); }
  });

  test('other clients are unaffected', async () => {
    const ctx = await startApp();
    try {
      for (let i = 0; i < 6; i++) await chat(ctx.base, `q${i}`, { realIp: '198.51.100.1' });
      assert.equal((await chat(ctx.base, 'hi there', { realIp: '198.51.100.2' })).status, 200);
    } finally { ctx.server.close(); }
  });
});

describe('chat: input limits', () => {
  test('empty, non-string and over-length queries → 400, no paid call', async () => {
    const ctx = await startApp({ env: { CHAT_PER_IP_PER_MINUTE: '50' } });
    try {
      for (const q of ['', '   ', 'x'.repeat(501)]) assert.equal((await chat(ctx.base, q)).status, 400);
      const obj = await fetch(`${ctx.base}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: { $gt: '' } }) });
      assert.equal(obj.status, 400);
      const big = await fetch(`${ctx.base}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: 'x', pad: 'y'.repeat(20_000) }) });
      assert.equal(big.status, 413);
      assert.equal((await chat(ctx.base, 'x'.repeat(500))).status, 200);
      assert.equal(ctx.paid(), 1);
    } finally { ctx.server.close(); }
  });
});

describe('chat: concurrency and global cap', () => {
  test('more than 3 simultaneous paid calls → 503 busy', async () => {
    const ctx = await startApp({ upstreamDelayMs: 200, env: { CHAT_PER_IP_PER_MINUTE: '50' } });
    try {
      const results = await Promise.all(Array.from({ length: 5 }, (_, i) => chat(ctx.base, `q${i}`, { realIp: `198.51.100.${i + 1}` })));
      const codes = results.map((r) => r.status).sort();
      assert.deepEqual(codes, [200, 200, 200, 503, 503]);
      assert.equal(ctx.paid(), 3);
      // Slots are released after responses finish.
      assert.equal((await chat(ctx.base, 'later', { realIp: '198.51.100.9' })).status, 200);
    } finally { ctx.server.close(); }
  });

  test('global daily cap → 503 for everyone, no paid call', async () => {
    const ctx = await startApp({ env: { CHAT_DAILY_CAP: '2' } });
    try {
      assert.equal((await chat(ctx.base, 'a', { realIp: '198.51.100.1' })).status, 200);
      assert.equal((await chat(ctx.base, 'b', { realIp: '198.51.100.2' })).status, 200);
      assert.equal((await chat(ctx.base, 'c', { realIp: '198.51.100.3' })).status, 503);
      assert.equal(ctx.paid(), 2);
    } finally { ctx.server.close(); }
  });

  test('window counter resets after its window', () => {
    let t = 0;
    const c = createWindowCounter({ windowMs: 1000, max: 1, now: () => t });
    assert.equal(c.take('k').ok, true);
    assert.equal(c.take('k').ok, false);
    t = 1001;
    assert.equal(c.take('k').ok, true);
  });
});

describe('refresh: admin only', () => {
  test('no token configured → 503, nothing flushed', async () => {
    const ctx = await startApp();
    try {
      const res = await fetch(`${ctx.base}/api/refresh`, { method: 'POST', headers: { Authorization: 'Bearer anything' } });
      assert.equal(res.status, 503);
      assert.equal(ctx.flushes(), 0);
    } finally { ctx.server.close(); }
  });

  test('missing or wrong token → 401, nothing flushed; correct token → 200', async () => {
    const ctx = await startApp({ env: { NEWS_ADMIN_TOKEN: 'news-admin-test-token' } });
    try {
      assert.equal((await fetch(`${ctx.base}/api/refresh`, { method: 'POST' })).status, 401);
      assert.equal((await fetch(`${ctx.base}/api/refresh`, { method: 'POST', headers: { Authorization: 'Bearer wrong' } })).status, 401);
      assert.equal(ctx.flushes(), 0);
      const ok = await fetch(`${ctx.base}/api/refresh`, { method: 'POST', headers: { Authorization: 'Bearer news-admin-test-token' } });
      assert.equal(ok.status, 200);
      assert.equal(ctx.flushes(), 1);
    } finally { ctx.server.close(); }
  });
});

describe('single flight', () => {
  test('concurrent misses share one upstream call; later calls run again', async () => {
    const sf = createSingleFlight();
    let calls = 0;
    const work = () => new Promise((r) => setTimeout(() => r(++calls), 20));
    const results = await Promise.all([sf('k', work), sf('k', work), sf('k', work)]);
    assert.deepEqual(results, [1, 1, 1]);
    assert.equal(await sf('k', work), 2);
  });

  test('a failure is shared and does not poison the next call', async () => {
    const sf = createSingleFlight();
    await assert.rejects(sf('k', async () => { throw new Error('upstream'); }));
    assert.equal(await sf('k', async () => 'ok'), 'ok');
  });
});
