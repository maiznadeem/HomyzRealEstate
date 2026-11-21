import crypto from 'node:crypto'
import asyncHandler from 'express-async-handler'

import { prisma } from '../config/prismaConfig.js'
import { httpError } from '../utils/http.js'
import {
    CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME, CLOUDINARY_FOLDER, CLOUDINARY_UPLOAD_PRESET,
} from '../config/cloudinaryConfig.js'

// Signatures are only issued for an upload starting right now.
const MAX_AGE_SECONDS = 120
const MAX_FUTURE_SECONDS = 30

// The exact parameters the upload widget may ask us to sign, each with a strict format. No
// value can contain '&' or '=', so nothing extra can be smuggled into the signed string.
// The object has no prototype, so keys like "constructor" are not rules.
const RULES = Object.assign(Object.create(null), {
    timestamp: (v) => /^\d{10}$/.test(v),
    upload_preset: (v) => v === CLOUDINARY_UPLOAD_PRESET,
    folder: (v) => v === CLOUDINARY_FOLDER,
    source: (v) => /^[a-z_]{1,16}$/.test(v),
    // A fresh random id per upload (see UploadImage.jsx). Each id is signed once, and the preset
    // never overwrites, so a signature can create at most one image however often it's replayed.
    public_id: (v) => /^[a-z0-9]{24}$/.test(v),
})
const REQUIRED = ['timestamp', 'upload_preset', 'folder', 'public_id']

// Every public id ever signed, kept permanently so an id can never be signed twice. One small
// document per upload, and uploads are rate-limited.
const NONCES = 'UploadNonce'

const claimPublicId = async (publicId, userEmail) => {
    // A duplicate _id comes back as a write error in the result rather than as an exception.
    const result = await prisma.$runCommandRaw({
        insert: NONCES,
        documents: [{ _id: publicId, userEmail, signedAt: { $date: new Date().toISOString() } }],
    })
    if (result?.writeErrors?.length || result?.n !== 1) {
        if (result?.writeErrors?.some((e) => e.code === 11000)) {
            throw httpError(409, 'This upload was already signed. Please choose the image again.')
        }
        throw new Error(`Could not record upload id: ${JSON.stringify(result?.writeErrors ?? result)}`)
    }
}

export const signUpload = asyncHandler(async (req, res) => {
    if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) throw httpError(503, 'Image uploads are not configured.')
    const input = req.body?.paramsToSign
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw httpError(400, 'Nothing to sign.')

    const params = Object.create(null)
    for (const [key, raw] of Object.entries(input)) {
        const value = typeof raw === 'number' ? String(raw) : raw
        if (!Object.hasOwn(RULES, key) || typeof value !== 'string' || /[&=]/.test(value) || !RULES[key](value)) {
            throw httpError(400, `Upload parameter "${key}" is not allowed.`)
        }
        params[key] = value
    }
    const missing = REQUIRED.find((key) => !params[key])
    if (missing) throw httpError(400, `Upload parameter "${missing}" is required.`)
    const age = Date.now() / 1000 - Number(params.timestamp)
    if (age > MAX_AGE_SECONDS || age < -MAX_FUTURE_SECONDS) throw httpError(400, 'Upload timestamp is out of range.')

    await claimPublicId(params.public_id, req.userEmail)

    // Cloudinary signature: sorted key=value pairs joined with &, followed by the API secret, SHA-1.
    const payload = Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join('&')
    const signature = crypto.createHash('sha1').update(payload + CLOUDINARY_API_SECRET).digest('hex')
    res.send({ signature, apiKey: CLOUDINARY_API_KEY, cloudName: CLOUDINARY_CLOUD_NAME })
})
