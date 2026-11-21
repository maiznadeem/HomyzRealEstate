import asyncHandler from 'express-async-handler'

import { prisma } from '../config/prismaConfig.js'
import { httpError, isObjectId } from '../utils/http.js'

export const createResidency = asyncHandler(async (req, res) => {
    const { title, description, price, address, country, city, facilities, image } = req.body.data ?? {}
    try {
        const residency = await prisma.residency.create({
            data: {
                title,
                description,
                price: Number(price),
                address,
                country,
                city,
                facilities,
                image,
                // The owner is whoever the access token belongs to.
                owner: { connect: { email: req.userEmail } },
            }
        })
        res.status(201).send({ message: "Residency created successfully.", residency })
    } catch (err) {
        if (err.code === "P2002") throw httpError(409, "A residency with this address already exists.")
        if (err.code === "P2025") throw httpError(404, "User not registered. Please log in again.")
        if (err.name === "PrismaClientValidationError") throw httpError(400, "Some property details are missing or invalid.")
        throw err
    }
})

export const getAllResidencies = asyncHandler(async (req, res) => {
    const residencies = await prisma.residency.findMany({
        orderBy: { createdAt: "desc" }
    })
    res.send(residencies)
})

export const getResidencyByID = asyncHandler(async (req, res) => {
    const { id } = req.params
    const residency = isObjectId(id) && await prisma.residency.findUnique({ where: { id } })
    if (!residency) throw httpError(404, "Residency not found.")
    res.send(residency)
})
