import { rateLimit, ipKeyGenerator } from 'express-rate-limit'

import { prisma } from '../config/prismaConfig.js'

// Fixed-window counters kept in MongoDB, so every serverless instance shares
// them. Each window is one document that MongoDB deletes once it expires.
const COLLECTION = 'RateLimit'
let ttlIndexReady = null

const ensureTtlIndex = () => {
    ttlIndexReady ??= prisma.$runCommandRaw({
        createIndexes: COLLECTION,
        indexes: [{ key: { expiresAt: 1 }, name: 'expiresAt_ttl', expireAfterSeconds: 0 }],
    }).catch((err) => {
        ttlIndexReady = null
        throw err
    })
    return ttlIndexReady
}

class MongoStore {
    localKeys = false

    constructor(prefix) {
        this.prefix = prefix
    }

    init(options) {
        this.windowMs = options.windowMs
    }

    async increment(key) {
        await ensureTtlIndex()
        const windowStart = Math.floor(Date.now() / this.windowMs) * this.windowMs
        const resetTime = new Date(windowStart + this.windowMs)
        const command = {
            findAndModify: COLLECTION,
            query: { _id: `${this.prefix}:${key}:${windowStart}` },
            update: { $inc: { count: 1 }, $setOnInsert: { expiresAt: { $date: resetTime.toISOString() } } },
            upsert: true,
            new: true,
        }
        let result
        try {
            result = await prisma.$runCommandRaw(command)
        } catch (err) {
            // Two first hits in the same window can race on the upsert; the retry increments.
            if (!String(err?.message).includes('E11000')) throw err
            result = await prisma.$runCommandRaw(command)
        }
        return { totalHits: Number(result.value?.count ?? 1), resetTime }
    }

    // Used by skipFailedRequests to give back a hit once the response fails.
    async decrement(key) {
        const windowStart = Math.floor(Date.now() / this.windowMs) * this.windowMs
        await prisma.$runCommandRaw({
            update: COLLECTION,
            updates: [{ q: { _id: `${this.prefix}:${key}:${windowStart}`, count: { $gt: 0 } }, u: { $inc: { count: -1 } } }],
        })
    }

    async resetKey() {}
}

// Through Cloudflare, originAuth sets the visitor's address from the Worker (trusted only with the secret).
// Otherwise Vercel overwrites X-Forwarded-For with the connecting address, so it can't be spoofed there.
const clientIp = (req) => {
    if (req.edgeClientIp) return ipKeyGenerator(req.edgeClientIp)
    const forwarded = process.env.VERCEL && req.headers['x-forwarded-for']
    return ipKeyGenerator(forwarded ? String(forwarded).split(',')[0].trim() : req.ip)
}

const limiter = ({ name, windowMs, limit, byUser = false, message, skipFailedRequests = false, failOpen = false }) => rateLimit({
    windowMs,
    limit,
    skipFailedRequests,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    store: new MongoStore(name),
    // Signed-in limits follow the account, so switching networks doesn't reset them.
    keyGenerator: (req) => (byUser && req.userEmail) || clientIp(req),
    message: { message: message || 'Too many requests. Please slow down and try again later.' },
    // Only the general limiter lets requests through when the counter store fails; the
    // limits on listings and uploads fail closed so a store outage can't switch them off.
    passOnStoreError: failOpen,
    validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
})

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE

// Every API request, per IP address.
export const apiLimiter = limiter({ name: 'api', windowMs: 15 * MINUTE, limit: 300, failOpen: true })

// Signed-in actions (favourites, bookings, registration), per account.
export const userLimiter = limiter({ name: 'user', windowMs: 15 * MINUTE, limit: 120, byUser: true })

// Adding properties, per account.
export const createResidencyLimiter = limiter({
    name: 'residency-create', windowMs: 24 * HOUR, limit: 5, byUser: true,
    message: 'You can add up to 5 properties per day. Please try again tomorrow.',
    // Only successful listings count; rejected attempts are still covered by apiLimiter.
    skipFailedRequests: true,
})

// Image upload signatures, per account.
export const uploadLimiter = limiter({
    name: 'upload', windowMs: HOUR, limit: 15, byUser: true,
    message: 'Too many image uploads. Please try again in an hour.',
})

// The same two actions per IP address, so creating many accounts doesn't multiply the limits.
export const createResidencyIpLimiter = limiter({
    name: 'residency-create-ip', windowMs: 24 * HOUR, limit: 15,
    message: 'Too many properties added from your network today. Please try again tomorrow.',
    skipFailedRequests: true,
})
export const uploadIpLimiter = limiter({
    name: 'upload-ip', windowMs: HOUR, limit: 40,
    message: 'Too many image uploads from your network. Please try again in an hour.',
})
