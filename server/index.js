import 'dotenv/config'
import './config/appSecrets.js'
import { log, errorFields, requestLog, rayOf, routeOf } from './utils/log.js'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

import { userRoute } from './routes/userRoute.js'
import { residencyRoute } from './routes/residencyRoute.js'
import { uploadRoute } from './routes/uploadRoute.js'
import { apiLimiter } from './middleware/rateLimit.js'
import { originAuth } from './middleware/originAuth.js'
import { keepAlive } from './controllers/keepAliveController.js'

// Same outcome as Node's default (the process exits), but logged as one structured line first.
process.on('unhandledRejection', (err) => {
    log.error('exception', 'Unhandled promise rejection', errorFields(err))
    process.exit(1)
})

const app = express()

const PORT = process.env.PORT || 8000
// Browsers may only call the API from these sites. Set CORS_ORIGINS (comma-separated) for local development.
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'https://homyz.himaiz.com').split(',').map((o) => o.trim())

app.disable('x-powered-by')
// One structured line per request (OracleVMOps LOGGING.md), including the ones refused below.
app.use(requestLog)
// Then: requests must come through the Cloudflare Worker (see middleware/originAuth.js).
app.use(originAuth)
app.use(helmet())
app.use(cors({ origin: CORS_ORIGINS, methods: ['GET', 'POST'], maxAge: 600 }))
app.use(express.json({ limit: '20kb' }))

app.get("/api/health", (req, res) => res.send({ ok: true }))
// Daily ping that touches the database so Atlas doesn't pause the free cluster; the edge Worker's cron calls it
// (edge/api/wrangler.toml).
app.get("/api/keepalive", keepAlive)
app.use("/api", apiLimiter)
app.use("/api/user", userRoute)
app.use("/api/residency", residencyRoute)
app.use("/api/upload", uploadRoute)
app.use((req, res) => res.status(404).json({ message: "Not found." }))

// Always answer with JSON so the client can show the message.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500
    if (status >= 500) log.error('exception', 'Unhandled error', { ray: rayOf(req), method: req.method, route: routeOf(req), ...errorFields(err) })
    res.status(status).json({
        message: status >= 500 ? "Something went wrong on the server." : err.message,
    })
})

app.listen(PORT, () => log.info('startup', 'Server is running', { port: Number(PORT) }))
