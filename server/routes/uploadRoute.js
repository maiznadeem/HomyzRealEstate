import express from 'express'

import jwtCheck from '../config/auth0Config.js'
import { uploadIpLimiter, uploadLimiter } from '../middleware/rateLimit.js'
import { signUpload } from '../controllers/uploadController.js'

const router = express.Router()

router.post("/signature", uploadIpLimiter, jwtCheck, uploadLimiter, signUpload)

export { router as uploadRoute }
