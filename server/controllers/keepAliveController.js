import { timingSafeEqual } from 'node:crypto'
import { prisma } from '../config/prismaConfig.js'

const matches = (given, expected) => {
    const a = Buffer.from(given)
    const b = Buffer.from(expected)
    return a.length === b.length && timingSafeEqual(a, b)
}

// The edge Worker's cron passes originAuth (req.viaEdge) and sends X-Edge-Cron, a header the Worker strips from
// every visitor request. Vercel's cron sends `Authorization: Bearer <CRON_SECRET>` instead.
export const keepAlive = async (req, res) => {
    const secret = process.env.CRON_SECRET
    const fromCron = Boolean(secret) && matches(req.get('authorization') ?? '', `Bearer ${secret}`)
    const fromEdgeCron = req.viaEdge === true && req.get('x-edge-cron') === '1'
    if (!fromEdgeCron && !fromCron) {
        return res.status(401).json({ message: 'Unauthorized.' })
    }
    try {
        // A real query (not just a ping) so Atlas counts it as activity.
        const residencies = await prisma.residency.count()
        res.json({ ok: true, residencies })
    } catch (err) {
        console.error('Keep-alive query failed:', err)
        res.status(503).json({ ok: false, message: 'Database unavailable.' })
    }
}
