import { auth } from 'express-oauth2-jwt-bearer'

// The "Homyz Real Estate" API in Auth0. Its post-login Action adds the user's
// verified email to access tokens under this namespace.
export const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || 'https://homyz-real-estate-backend.vercel.app/'
const ISSUER_BASE_URL = process.env.AUTH0_ISSUER_BASE_URL || 'https://dev-ccw5bra5gc5nxss7.us.auth0.com'
const CLAIM_NAMESPACE = 'https://homyz-real-estate/'

const verifyToken = auth({
    audience: AUTH0_AUDIENCE,
    issuerBaseURL: ISSUER_BASE_URL,
    tokenSigningAlg: 'RS256',
})

// Verifies the bearer token, then exposes the caller's email as req.userEmail.
// Every user-scoped route must use req.userEmail, never an email from the body.
const requireUserEmail = (req, res, next) => {
    const payload = req.auth?.payload ?? {}
    const email = payload[`${CLAIM_NAMESPACE}email`]
    if (email) {
        req.userEmail = String(email).toLowerCase()
        return next()
    }
    const message = payload[`${CLAIM_NAMESPACE}email_verified`] === false
        ? 'Please verify your email address, then log in again.'
        : 'Your access token does not identify a user. Please log in again.'
    res.status(403).json({ message })
}

const jwtCheck = [verifyToken, requireUserEmail]

export default jwtCheck
