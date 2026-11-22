// Cloudflare Worker on api.homyz.himaiz.com: the zone's WAF runs before it, then it forwards every request
// unchanged to the API on Cloud Run, adding the shared secret the API requires and the visitor's address.
// Bodies stream through unchanged.
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const headers = new Headers(request.headers);
        for (const name of ['host', 'x-origin-auth', 'x-client-ip', 'x-forwarded-host', 'x-forwarded-proto', 'x-edge-cron']) headers.delete(name);
        headers.set('x-origin-auth', env.ORIGIN_AUTH);
        headers.set('x-client-ip', request.headers.get('cf-connecting-ip') ?? '');
        headers.set('x-forwarded-host', url.host);
        headers.set('x-forwarded-proto', 'https');

        // Copy the fixed origin and set only path and query. Resolving the path as a relative URL would let a
        // path like "//evil.example/x" send the request (and the secret) to another host.
        const target = new URL(env.ORIGIN);
        target.pathname = url.pathname;
        target.search = url.search;

        return fetch(target, {
            method: request.method,
            headers,
            body: request.body,
            redirect: 'manual',
        });
    },

    // Daily cron (wrangler.toml): a real database query through the API, so Atlas doesn't pause the free
    // cluster after a quiet stretch. X-Edge-Cron marks the call as this cron; fetch() strips it from visitor
    // requests, so the public can't reach the keep-alive. A failure throws and shows as a failed run in the logs.
    async scheduled(controller, env) {
        const target = new URL(env.ORIGIN);
        target.pathname = '/api/keepalive';
        const res = await fetch(target, { headers: { 'x-origin-auth': env.ORIGIN_AUTH, 'x-edge-cron': '1' } });
        const body = await res.text();
        if (!res.ok) throw new Error(`Keep-alive failed: ${res.status} ${body.slice(0, 200)}`);
        console.log(`Keep-alive ok: ${body}`);
    },
};
