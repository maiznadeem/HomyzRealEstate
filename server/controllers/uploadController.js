import crypto from 'node:crypto'

import { httpError } from '../utils/http.js'
import {
    CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME, CLOUDINARY_FOLDER, CLOUDINARY_UPLOAD_PRESET,
} from '../config/cloudinaryConfig.js'

// Signatures are only issued for an upload starting right now, which keeps the window in
// which one signature can be replayed short.
const MAX_AGE_SECONDS = 120
const MAX_FUTURE_SECONDS = 30

// The only parameters the upload widget may ask us to sign, each with a strict format. Values
// can't contain '&' or '=', so nobody can smuggle extra parameters into the signed string,
// and anything else (public_id, overwrite, other folders or presets...) is refused.
const RULES = {
    timestamp: (v) => /^\d{10}$/.test(v),
    upload_preset: (v) => v === CLOUDINARY_UPLOAD_PRESET,
    folder: (v) => v === CLOUDINARY_FOLDER,
    source: (v) => /^[a-z_]{1,16}$/.test(v),
}

export const signUpload = (req, res) => {
    if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) throw httpError(503, 'Image uploads are not configured.')
    const input = req.body?.paramsToSign
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw httpError(400, 'Nothing to sign.')

    const params = {}
    for (const [key, raw] of Object.entries(input)) {
        const value = typeof raw === 'number' ? String(raw) : raw
        if (!RULES[key] || typeof value !== 'string' || !RULES[key](value)) {
            throw httpError(400, `Upload parameter "${key}" is not allowed.`)
        }
        params[key] = value
    }
    if (params.upload_preset !== CLOUDINARY_UPLOAD_PRESET || !params.timestamp) throw httpError(400, 'Wrong upload preset.')
    const age = Date.now() / 1000 - Number(params.timestamp)
    if (age > MAX_AGE_SECONDS || age < -MAX_FUTURE_SECONDS) throw httpError(400, 'Upload timestamp is out of range.')

    // Cloudinary signature: sorted key=value pairs joined with &, followed by the API secret, SHA-1.
    const payload = Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join('&')
    const signature = crypto.createHash('sha1').update(payload + CLOUDINARY_API_SECRET).digest('hex')
    res.send({ signature, apiKey: CLOUDINARY_API_KEY, cloudName: CLOUDINARY_CLOUD_NAME })
}
