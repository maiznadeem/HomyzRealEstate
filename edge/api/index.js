// Cloudflare Worker on api.homyz.himaiz.com: the zone's WAF runs before it, then it forwards every request
// unchanged to the API on Cloud Run, adding the shared secret the API requires and the visitor's address.
// Bodies stream through unchanged. Each request is logged as one JSON line (OracleVMOps LOGGING.md) and carries
// the visitor's CF-Ray to the API as X-CF-Ray, which the API logs as `ray`, so one ray finds both lines.

// The API's routes, so the log shows a pattern and never a raw path (ids, or junk from scanners).
const ROUTES = new Set([
    '/api/health', '/api/keepalive', '/api/residency/getall', '/api/residency/create', '/api/residency/:id',
    '/api/upload/signature', '/api/user/register', '/api/user/bookvisit/:id', '/api/user/getallbookings',
    '/api/user/cancelbooking/:id', '/api/user/managefavourites/:id', '/api/user/getallfavourites',
]);
const routeOf = (pathname) => {
    const pattern = pathname.split('/').map((s) => (/^[0-9a-f]{24}$/i.test(s) ? ':id' : s)).join('/');
    return ROUTES.has(pattern) ? pattern : '(other)';
};
const QUIET = new Set(['/api/health', '/api/keepalive']);

const logLine = (fields) => console.log(JSON.stringify({ time: new Date().toISOString(), app: 'homyz', part: 'edge', ...fields }));

export default {
    async fetch(request, env) {
        const started = Date.now();
        const url = new URL(request.url);
        const ray = request.headers.get('cf-ray') ?? '';
        const headers = new Headers(request.headers);
        for (const name of ['host', 'x-origin-auth', 'x-client-ip', 'x-forwarded-host', 'x-forwarded-proto', 'x-edge-cron', 'x-cf-ray']) headers.delete(name);
        headers.set('x-origin-auth', env.ORIGIN_AUTH);
        headers.set('x-client-ip', request.headers.get('cf-connecting-ip') ?? '');
        headers.set('x-forwarded-host', url.host);
        headers.set('x-forwarded-proto', 'https');
        // Cloudflare gives this Worker's call to the origin a new CF-Ray, so the visitor's ray travels as X-CF-Ray.
        headers.set('x-cf-ray', ray);

        // Copy the fixed origin and set only path and query. Resolving the path as a relative URL would let a
        // path like "//evil.example/x" send the request (and the secret) to another host.
        const target = new URL(env.ORIGIN);
        target.pathname = url.pathname;
        target.search = url.search;

        const route = routeOf(url.pathname);
        const line = (level, status, extra) => logLine({
            level, event: 'request', ray, msg: 'forwarded to origin', method: request.method, route, status,
            ms: Date.now() - started, ...extra,
        });

        try {
            const response = await fetch(target, {
                method: request.method,
                headers,
                body: request.body,
                redirect: 'manual',
            });
            const quiet = request.method === 'OPTIONS' || QUIET.has(route);
            line(response.status >= 500 ? 'error' : quiet ? 'debug' : 'info', response.status);
            return response;
        } catch (err) {
            line('error', 502, { event: 'exception', msg: 'origin unreachable', error: err?.name ?? 'Error' });
            throw err;
        }
    },

    // Daily cron (wrangler.toml): a real database query through the API, so Atlas doesn't pause the free
    // cluster after a quiet stretch. X-Edge-Cron marks the call as this cron; fetch() strips it from visitor
    // requests, so the public can't reach the keep-alive. A failure is logged and thrown, so the run shows as failed.
    async scheduled(controller, env) {
        const started = Date.now();
        const target = new URL(env.ORIGIN);
        target.pathname = '/api/keepalive';
        const res = await fetch(target, { headers: { 'x-origin-auth': env.ORIGIN_AUTH, 'x-edge-cron': '1' } });
        await res.body?.cancel();
        const fields = { method: 'GET', route: '/api/keepalive', status: res.status, ms: Date.now() - started, cron: controller.cron };
        if (!res.ok) {
            logLine({ level: 'error', event: 'exception', msg: 'keep-alive failed', ...fields });
            throw new Error(`Keep-alive failed: ${res.status}`);
        }
        logLine({ level: 'debug', event: 'keepalive', msg: 'keep-alive ok', ...fields });
    },
};
