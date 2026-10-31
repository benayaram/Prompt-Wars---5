import type { IncomingMessage, ServerResponse } from 'node:http';
import { loadEnv, type Plugin, type ViteDevServer } from 'vite';

type Handler = (
  req: {
    method?: string;
    headers: IncomingMessage['headers'];
    body?: unknown;
    socket?: { remoteAddress?: string };
  },
  res: {
    status(code: number): unknown;
    json(body: unknown): void;
    setHeader(name: string, value: string): void;
    write(chunk: string): unknown;
    end(): unknown;
  },
) => Promise<void>;

const MAX_DEV_BODY_BYTES = 32_768;

const DEV_SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
};

function hasDevProtoPollution(obj: unknown): boolean {
  if (typeof obj !== 'object' || obj === null) return false;
  if (Array.isArray(obj)) return obj.some(hasDevProtoPollution);
  for (const [key, value] of Object.entries(obj)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') return true;
    if (hasDevProtoPollution(value)) return true;
  }
  return false;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk: Buffer) => {
      if (data.length <= MAX_DEV_BODY_BYTES + 1024) data += chunk.toString('utf8');
    });
    req.on('end', () => resolve(data));
  });
}

async function handleApi(
  server: ViteDevServer,
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
): Promise<void> {
  const route = /^\/api\/([a-z-]+)(?:\?.*)?$/.exec(req.url ?? '')?.[1];
  if (!route) {
    next();
    return;
  }
  for (const [key, value] of Object.entries(DEV_SECURITY_HEADERS)) {
    res.setHeader(key, value);
  }
  const raw = await readBody(req);
  if (Buffer.byteLength(raw) > MAX_DEV_BODY_BYTES) {
    res.statusCode = 413;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'PAYLOAD_TOO_LARGE' }));
    return;
  }
  let body: unknown = raw;
  if ((req.headers['content-type'] ?? '').startsWith('application/json')) {
    try {
      body = raw ? (JSON.parse(raw) as unknown) : {};
    } catch {
      body = raw;
    }
  }
  if (hasDevProtoPollution(body)) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'INVALID_INPUT' }));
    return;
  }
  const reply = (status: number, payload: unknown) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(payload));
  };
  try {
    const mod = (await server.ssrLoadModule(`/api/${route}.ts`)) as { default?: Handler };
    if (typeof mod.default !== 'function') {
      reply(404, { error: 'NOT_FOUND' });
      return;
    }
    let status = 200;
    const adapter = {
      status(code: number) {
        status = code;
        return adapter;
      },
      json(payload: unknown) {
        reply(status, payload);
      },
      setHeader(name: string, value: string) {
        res.setHeader(name, value);
      },
      write(chunk: string) {
        res.statusCode = status;
        return res.write(chunk);
      },
      end() {
        return res.end();
      },
    };
    await mod.default(
      {
        method: req.method,
        headers: req.headers,
        body,
        socket: { remoteAddress: req.socket.remoteAddress },
      },
      adapter,
    );
  } catch {
    reply(404, { error: 'NOT_FOUND' });
  }
}

/** Serves /api/* from the same handlers Vercel runs, so `npm run dev` works end to end. */
export function devApi(): Plugin {
  return {
    name: 'utsaviq-dev-api',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv('development', process.cwd(), '');
      for (const key of ['GEMINI_API_KEY', 'GEMINI_MODEL']) {
        if (env[key] && !process.env[key]) process.env[key] = env[key];
      }
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        void handleApi(server, req, res, next);
      });
    },
  };
}
