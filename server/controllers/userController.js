import asyncHandler from 'express-async-handler'

import { prisma } from '../config/prismaConfig.js'
import { httpError, isObjectId } from '../utils/http.js'
import { visitDate } from '../utils/validate.js'

// req.userEmail comes from the verified access token (see config/auth0Config.js).

const findUser = async (email, select) => {
    const user = await prisma.user.findUnique({ where: { email }, select })
    if (!user) throw httpError(404, "User not registered. Please log in again.")
    return user
}

const MAX_BOOKINGS = 50
const MAX_FAVOURITES = 200

const requireResidency = async (id) => {
    const exists = isObjectId(id) && await prisma.residency.findUnique({ where: { id }, select: { id: true } })
    if (!exists) throw httpError(404, "Residency not found.")
}

export const createUser = asyncHandler(async (req, res) => {
    const email = req.userEmail
    const userExists = await prisma.user.findUnique({ where: { email } })
    if (userExists) return res.status(200).send({ message: "User already registered." })
    await prisma.user.create({ data: { email } })
    res.status(201).send({ message: "User registered successfully." })
})

export const bookVisit = asyncHandler(async (req, res) => {
    const email = req.userEmail
    const date = visitDate(req.body?.date)
    const { id } = req.params
    await requireResidency(id)
    const user = await findUser(email, { bookedVisits: true })
    if (user.bookedVisits.some(visit => visit.id === id)) {
        return res.status(400).json({ message: "You've already booked this place." })
    }
    if (user.bookedVisits.length >= MAX_BOOKINGS) throw httpError(403, `You can have up to ${MAX_BOOKINGS} bookings.`)
    await prisma.user.update({
        where: { email },
        data: { bookedVisits: { push: { id, date } } },
    })
    res.send({ message: "Booked successfully." })
})

export const getAllBookings = asyncHandler(async (req, res) => {
    const user = await findUser(req.userEmail, { bookedVisits: true })
    res.status(200).send(user)
})

export const cancelBooking = asyncHandler(async (req, res) => {
    const email = req.userEmail
    const { id } = req.params
    const user = await findUser(email, { bookedVisits: true })
    const bookedVisits = user.bookedVisits.filter(visit => visit.id !== id)
    if (bookedVisits.length === user.bookedVisits.length) {
        return res.status(404).json({ message: "Booking not found!" })
    }
    await prisma.user.update({ where: { email }, data: { bookedVisits } })
    res.send({ message: "Booking cancelled successfully." })
})

export const manageFavourites = asyncHandler(async (req, res) => {
    const email = req.userEmail
    const { id } = req.params
    if (!isObjectId(id)) throw httpError(400, "Invalid residency ID.")
    const user = await findUser(email, { favResidenciesID: true })
    if (user.favResidenciesID.includes(id)) {
        const updated = await prisma.user.update({
            where: { email },
            data: { favResidenciesID: { set: user.favResidenciesID.filter(rid => rid !== id) } },
            select: { favResidenciesID: true },
        })
        return res.send({ message: "Removed from favourites.", ...updated })
    }
    await requireResidency(id)
    if (user.favResidenciesID.length >= MAX_FAVOURITES) throw httpError(403, `You can save up to ${MAX_FAVOURITES} favourites.`)
    const updated = await prisma.user.update({
        where: { email },
        data: { favResidenciesID: { push: id } },
        select: { favResidenciesID: true },
    })
    res.send({ message: "Added to favourites.", ...updated })
})

export const getAllFavourites = asyncHandler(async (req, res) => {
    const user = await findUser(req.userEmail, { favResidenciesID: true })
    res.status(200).send(user)
})
