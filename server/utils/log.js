// Structured logging per OracleVMOps LOGGING.md: one JSON object per line on stdout, which Cloud Logging and Argus
// both parse. Never pass request bodies, cookies, tokens or emails; keys that look secret are redacted anyway.
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 }
const minLevel = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info
const SECRET_KEY = /token|secret|password|authorization|cookie|email/i

const write = (level, event, msg, fields = {}) => {
    if (LEVELS[level] < minLevel) return
    const line = { time: new Date().toISOString(), level, app: 'homyz', part: 'api', event, msg }
    for (const [key, value] of Object.entries(fields)) {
        if (value === undefined || key in line) continue
        line[key] = SECRET_KEY.test(key) ? '[redacted]' : value
    }
    // Cloud Logging reads `severity`; Argus reads `level`.
    line.severity = level === 'warn' ? 'WARNING' : level.toUpperCase()
    process.stdout.write(`${JSON.stringify(line)}\n`)
}

export const log = {
    debug: (event, msg, fields) => write('debug', event, msg, fields),
    info: (event, msg, fields) => write('info', event, msg, fields),
    warn: (event, msg, fields) => write('warn', event, msg, fields),
    error: (event, msg, fields) => write('error', event, msg, fields),
}

// For failures on our side: the error type, its code and the stack frames, without the message. Prisma and
// MongoDB messages can quote the query, including a user's email, so the message itself is never logged.
export const errorFields = (err) => ({
    error: err?.name ?? typeof err,
    code: typeof err?.code === 'string' ? err.code : undefined,
    stack: typeof err?.stack === 'string' ? err.stack.split('\n').filter((l) => l.startsWith('    at ')).join('\n') : undefined,
})

// Cloudflare's ray for the visitor's request. The edge Worker passes it as X-CF-Ray, because Cloudflare gives the
// Worker's own call to this origin a new CF-Ray; CF-Ray is the fallback for anything that reaches us directly.
export const rayOf = (req) => req.get('x-cf-ray') || req.get('cf-ray') || undefined

// The route pattern Express matched (never the raw URL, which carries ids).
export const routeOf = (req) => (req.route ? `${req.baseUrl}${req.route.path}` : '(unmatched)')

const QUIET_ROUTES = new Set(['/api/health', '/api/keepalive'])

// One line per request when the response finishes. Health checks, the keep-alive and preflights at debug, 5xx at
// error. The user is the Auth0 user id from the verified token, never the email.
export const requestLog = (req, res, next) => {
    const started = process.hrtime.bigint()
    res.on('finish', () => {
        const route = routeOf(req)
        const quiet = req.method === 'OPTIONS' || QUIET_ROUTES.has(route)
        const level = res.statusCode >= 500 ? 'error' : quiet ? 'debug' : 'info'
        write(level, 'request', `${req.method} ${route} ${res.statusCode}`, {
            ray: rayOf(req),
            method: req.method,
            route,
            status: res.statusCode,
            ms: Math.round(Number(process.hrtime.bigint() - started) / 1e6),
            user: req.auth?.payload?.sub,
        })
    })
    next()
}
