import { beforeEach, describe, expect, it } from 'vitest';
import {
  clientIp,
  hasPrototypePollution,
  rateLimited,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
  resetRateLimit,
  sameOrigin,
} from '../../api/_lib/http';
import parseIntake from '../../api/parse-intake';
import { mockReq, mockRes } from './helpers';

beforeEach(() => resetRateLimit());

describe('clientIp', () => {
  it('prefers platform headers, then forwarded-for, then the socket, then "unknown"', () => {
    expect(
      clientIp({ headers: { 'x-vercel-forwarded-for': '1.1.1.1', 'x-real-ip': '2.2.2.2' } }),
    ).toBe('1.1.1.1');
    expect(clientIp({ headers: { 'x-forwarded-for': '3.3.3.3, 4.4.4.4' } })).toBe('3.3.3.3');
    expect(clientIp({ headers: {}, socket: { remoteAddress: '5.5.5.5' } })).toBe('5.5.5.5');
    expect(clientIp({ headers: {} })).toBe('unknown');
  });

  it('rejects malformed IP addresses and falls back safely', () => {
    expect(
      clientIp({
        headers: { 'x-vercel-forwarded-for': 'invalid-ip', 'x-forwarded-for': 'malformed' },
        socket: { remoteAddress: '127.0.0.1' },
      }),
    ).toBe('127.0.0.1');
    expect(
      clientIp({
        headers: { 'x-forwarded-for': '../../etc/passwd, not-an-ip' },
      }),
    ).toBe('unknown');
  });
});

describe('in-memory rate limiter', () => {
  it('allows the limit, refuses the next, and frees the window afterwards', () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) expect(rateLimited('ip', 0)).toBe(false);
    expect(rateLimited('ip', 1)).toBe(true);
    expect(rateLimited('ip', RATE_LIMIT_WINDOW_MS + 1)).toBe(false);
  });

  it('prunes idle addresses once it tracks many, so memory stays bounded', () => {
    for (let i = 0; i < 5001; i++) rateLimited(`ip-${i}`, 0);
    expect(rateLimited('fresh', RATE_LIMIT_WINDOW_MS * 2)).toBe(false);
    // The old addresses were pruned, so they start again from zero.
    expect(rateLimited('ip-1', RATE_LIMIT_WINDOW_MS * 2)).toBe(false);
  });
});

describe('sameOrigin', () => {
  it('needs both an origin and a host', () => {
    expect(sameOrigin({ headers: { origin: 'https://a.test', host: '' } })).toBe(false);
    expect(sameOrigin({ headers: { origin: 'https://a.test', host: 'a.test' } })).toBe(true);
    expect(sameOrigin({ headers: { origin: ['https://a.test'], host: ['a.test'] } })).toBe(true);
    expect(sameOrigin({ headers: { origin: 'not-a-valid-url', host: 'a.test' } })).toBe(false);
  });
});

describe('prototype pollution check', () => {
  it('returns false for clean objects and arrays', () => {
    expect(hasPrototypePollution(null)).toBe(false);
    expect(hasPrototypePollution(123)).toBe(false);
    expect(hasPrototypePollution({ clean: 'data', list: [1, 2, 3] })).toBe(false);
  });
});

describe('body size guard', () => {
  it('treats a body that cannot be measured as too large', async () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const { res, out } = mockRes();
    await parseIntake(mockReq({ body: circular }), res);
    expect(out.status).toBe(413);
  });
  it('a missing body counts as empty and is rejected as invalid input', async () => {
    const { res, out } = mockRes();
    await parseIntake(mockReq({ body: undefined }), res);
    expect(out.status).toBe(400);
  });

  it('rejects prototype-pollution payloads with 400', async () => {
    const { res, out } = mockRes();
    await parseIntake(
      mockReq({
        body: JSON.parse('{"__proto__": {"admin": true}, "text": "wedding in goa"}'),
      }),
      res,
    );
    expect(out.status).toBe(400);

    const { res: res2, out: out2 } = mockRes();
    await parseIntake(
      mockReq({
        body: JSON.parse('{"options": [{"constructor": {}}], "text": "wedding in goa"}'),
      }),
      res2,
    );
    expect(out2.status).toBe(400);
  });

  it('sets strict HTTP security headers on all responses', async () => {
    const { res, out } = mockRes();
    await parseIntake(mockReq({ body: undefined }), res);
    expect(out.headers['X-Content-Type-Options']).toBe('nosniff');
    expect(out.headers['X-Frame-Options']).toBe('DENY');
    expect(out.headers['Cross-Origin-Resource-Policy']).toBe('same-origin');
    expect(out.headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  });

  it('accepts array headers and handles empty array headers gracefully', async () => {
    const { res: r1, out: o1 } = mockRes();
    await parseIntake(
      mockReq({ headers: { 'content-type': ['application/json'] }, body: { text: 'a' } }),
      r1,
    );
    expect([200, 502, 503]).toContain(o1.status);

    const { res: r2, out: o2 } = mockRes();
    await parseIntake(mockReq({ headers: { 'content-type': [] } }), r2);
    expect(o2.status).toBe(415);
  });
});
