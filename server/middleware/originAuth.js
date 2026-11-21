import { timingSafeEqual } from 'node:crypto'

// The public API hostname (api.homyz.himaiz.com) is a Cloudflare Worker (WAF in front) that forwards to this
// Vercel deployment with X-Origin-Auth set to a shared secret and X-Client-IP set to the visitor's address.
// Requests that skip Cloudflare (the *.vercel.app URLs) don't carry the secret. ORIGIN_AUTH_MODE=enforce
// rejects them; any other value only logs them, for rollout. Without ORIGIN_AUTH (local development and
// previews) the check is off.
const secret = process.env.ORIGIN_AUTH ? Buffer.from(process.env.ORIGIN_AUTH) : null
const enforce = process.env.ORIGIN_AUTH_MODE === 'enforce'

// Vercel calls its cron inside the platform, without the Worker; CRON_SECRET protects that route.
const EXEMPT = new Set(['/api/keepalive'])

const fromWorker = (req) => {
    const sent = req.get('x-origin-auth')
    if (!secret || !sent) return false
    const given = Buffer.from(sent)
    return given.length === secret.length && timingSafeEqual(given, secret)
}

export const originAuth = (req, res, next) => {
    if (!secret) return next()
    if (fromWorker(req)) {
        // Behind the Worker, Vercel's X-Forwarded-For is a Cloudflare address; the limiter uses this instead.
        const clientIp = req.get('x-client-ip')
        if (clientIp) req.edgeClientIp = clientIp
        return next()
    }
    if (EXEMPT.has(req.path)) return next()
    if (!enforce) {
        console.warn(`Origin auth missing (log only): ${req.method} ${req.path}`)
        return next()
    }
    res.status(403).json({ message: 'Forbidden.' })
}
