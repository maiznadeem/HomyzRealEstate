import asyncHandler from 'express-async-handler'

import { prisma } from '../config/prismaConfig.js'
import { httpError, isObjectId } from '../utils/http.js'
import { residencyInput } from '../utils/validate.js'

const MAX_RESIDENCIES_PER_USER = 20
// Public reads never include the owner's email address.
const PUBLIC_FIELDS = { userEmail: true }

export const createResidency = asyncHandler(async (req, res) => {
    const data = residencyInput(req.body?.data)
    const owned = await prisma.residency.count({ where: { userEmail: req.userEmail } })
    if (owned >= MAX_RESIDENCIES_PER_USER) throw httpError(403, `You can list up to ${MAX_RESIDENCIES_PER_USER} properties.`)
    try {
        const residency = await prisma.residency.create({
            data: {
                ...data,
                // The owner is whoever the access token belongs to.
                owner: { connect: { email: req.userEmail } },
            }
        })
        res.status(201).send({ message: "Residency created successfully.", residency: { ...residency, userEmail: undefined } })
    } catch (err) {
        if (err.code === "P2002") throw httpError(409, "A residency with this address already exists.")
        if (err.code === "P2025") throw httpError(404, "User not registered. Please log in again.")
        throw err
    }
})

export const getAllResidencies = asyncHandler(async (req, res) => {
    const residencies = await prisma.residency.findMany({
        orderBy: { createdAt: "desc" },
        take: 500,
        omit: PUBLIC_FIELDS,
    })
    res.send(residencies)
})

export const getResidencyByID = asyncHandler(async (req, res) => {
    const { id } = req.params
    const residency = isObjectId(id) && await prisma.residency.findUnique({ where: { id }, omit: PUBLIC_FIELDS })
    if (!residency) throw httpError(404, "Residency not found.")
    res.send(residency)
})
