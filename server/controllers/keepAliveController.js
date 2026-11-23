import { prisma } from '../config/prismaConfig.js'
import { log, errorFields } from '../utils/log.js'

// Only the edge Worker's daily cron may call this: it passes originAuth (req.viaEdge) and sends X-Edge-Cron,
// a header the Worker strips from every visitor request.
export const keepAlive = async (req, res) => {
    if (req.viaEdge !== true || req.get('x-edge-cron') !== '1') {
        return res.status(401).json({ message: 'Unauthorized.' })
    }
    try {
        // A real query (not just a ping) so Atlas counts it as activity.
        const residencies = await prisma.residency.count()
        res.json({ ok: true, residencies })
    } catch (err) {
        log.error('exception', 'Keep-alive query failed', errorFields(err))
        res.status(503).json({ ok: false, message: 'Database unavailable.' })
    }
}
