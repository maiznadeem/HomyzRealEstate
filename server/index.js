import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'

import { userRoute } from './routes/userRoute.js'
import { residencyRoute } from './routes/residencyRoute.js'

dotenv.config({ quiet: true })

const app = express()

const PORT = process.env.PORT || 8000

app.use(express.json())
app.use(cors())

app.get("/api/health", (req, res) => res.send({ ok: true }))
app.use("/api/user", userRoute)
app.use("/api/residency", residencyRoute)

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
