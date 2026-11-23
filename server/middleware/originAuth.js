import { timingSafeEqual } from 'node:crypto'
import { log, rayOf } from '../utils/log.js'

// The public API hostname (api.homyz.himaiz.com) is a Cloudflare Worker (WAF in front) that forwards to this
// service with X-Origin-Auth set to a shared secret and X-Client-IP set to the visitor's address.
// Requests that skip Cloudflare (the *.run.app URL) don't carry the secret. ORIGIN_AUTH_MODE=enforce
// rejects them; any other value only logs them, for rollout. Without ORIGIN_AUTH and without enforce (local
// development) the check is off.
const secret = process.env.ORIGIN_AUTH ? Buffer.from(process.env.ORIGIN_AUTH) : null
const enforce = process.env.ORIGIN_AUTH_MODE === 'enforce'

// Fail closed: a secret dropped from Secret Manager must not quietly reopen the *.run.app URL. Refusing to start
// keeps the new Cloud Run revision from becoming ready, so traffic stays on the last good one.
if (enforce && !secret) {
    log.error('config_missing', 'ORIGIN_AUTH_MODE=enforce but ORIGIN_AUTH is missing; refusing to start')
    throw new Error('ORIGIN_AUTH_MODE=enforce but ORIGIN_AUTH is missing; refusing to start')
}

const fromWorker = (req) => {
    const sent = req.get('x-origin-auth')
    if (!secret || !sent) return false
    const given = Buffer.from(sent)
    return given.length === secret.length && timingSafeEqual(given, secret)
}

export const originAuth = (req, res, next) => {
    if (!secret) return next()
    if (fromWorker(req)) {
        // Behind the Worker, X-Forwarded-For is a Cloudflare address; the limiter uses this instead.
        req.viaEdge = true
        const clientIp = req.get('x-client-ip')
        if (clientIp) req.edgeClientIp = clientIp
        return next()
    }
    if (!enforce) {
        log.warn('origin_auth_missing', 'Request without the edge secret (log only)', { ray: rayOf(req), method: req.method })
        return next()
    }
    res.status(403).json({ message: 'Forbidden.' })
}
