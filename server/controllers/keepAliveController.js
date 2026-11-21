import { timingSafeEqual } from 'node:crypto'
import { prisma } from '../config/prismaConfig.js'

const matches = (given, expected) => {
    const a = Buffer.from(given)
    const b = Buffer.from(expected)
    return a.length === b.length && timingSafeEqual(a, b)
}

// Vercel sends `Authorization: Bearer <CRON_SECRET>` on cron invocations.
export const keepAlive = async (req, res) => {
    const secret = process.env.CRON_SECRET
    if (!secret || !matches(req.get('authorization') ?? '', `Bearer ${secret}`)) {
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
