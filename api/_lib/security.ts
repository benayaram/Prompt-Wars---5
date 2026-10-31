import { isIP } from 'node:net';
import type { ApiRequest } from './http.js';

export const MAX_REQUEST_BODY_BYTES = 32_768;

export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
};

function header(req: ApiRequest, name: string): string {
  const value = req.headers[name];
  return (Array.isArray(value) ? value[0] : value) ?? '';
}

/** Best-effort client address, used only as a rate-limit key. Strictly validates IP format. */
export function clientIp(req: ApiRequest): string {
  const platform = header(req, 'x-vercel-forwarded-for') || header(req, 'x-real-ip');
  if (platform && isIP(platform)) return platform;
  const forwarded = header(req, 'x-forwarded-for').split(',');
  for (const entry of forwarded) {
    const trimmed = entry.trim();
    if (trimmed && isIP(trimmed)) return trimmed;
  }
  const socketAddr = req.socket?.remoteAddress;
  if (socketAddr && isIP(socketAddr)) return socketAddr;
  return 'unknown';
}

/** Validates that an object contains no prototype-pollution keys (__proto__, constructor, prototype). */
export function hasPrototypePollution(obj: unknown): boolean {
  if (typeof obj !== 'object' || obj === null) return false;
  if (Array.isArray(obj)) return obj.some(hasPrototypePollution);
  for (const [key, value] of Object.entries(obj)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') return true;
    if (hasPrototypePollution(value)) return true;
  }
  return false;
}

/**
 * Only our own pages may spend the AI quota. Browsers always send Origin on a POST; it must match
 * the host serving the API. Cross-site requests and clients that hide where they come from are
 * refused. (A determined server-side caller can still forge headers, which the rate limit covers.)
 */
export function sameOrigin(req: ApiRequest): boolean {
  const origin = header(req, 'origin');
  const host = header(req, 'x-forwarded-host') || header(req, 'host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host.split(',')[0]?.trim();
  } catch {
    return false;
  }
}
