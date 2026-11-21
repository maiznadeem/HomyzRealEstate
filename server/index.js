import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

import { userRoute } from './routes/userRoute.js'
import { residencyRoute } from './routes/residencyRoute.js'
import { uploadRoute } from './routes/uploadRoute.js'
import { apiLimiter } from './middleware/rateLimit.js'
import { originAuth } from './middleware/originAuth.js'
import { keepAlive } from './controllers/keepAliveController.js'

const app = express()

const PORT = process.env.PORT || 8000
// Browsers may only call the API from these sites. Set CORS_ORIGINS (comma-separated) for local development.
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'https://homyz.himaiz.com,https://homyz-real-estate.vercel.app').split(',').map((o) => o.trim())

app.disable('x-powered-by')
// First: requests must come through the Cloudflare Worker (see middleware/originAuth.js).
app.use(originAuth)
app.use(helmet())
app.use(cors({ origin: CORS_ORIGINS, methods: ['GET', 'POST'], maxAge: 600 }))
app.use(express.json({ limit: '20kb' }))

app.get("/api/health", (req, res) => res.send({ ok: true }))
// Daily Vercel cron (vercel.json) that touches the database so Atlas doesn't pause the free cluster.
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
    if (status >= 500) console.error(err)
    res.status(status).json({
        message: status >= 500 ? "Something went wrong on the server." : err.message,
    })
})

if (!process.env.VERCEL) {
    app.listen(PORT, () => console.log(`Server is running on port: ${PORT}`))
}

export default app
