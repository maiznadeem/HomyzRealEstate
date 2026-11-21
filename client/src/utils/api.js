import axios from 'axios'
import dayjs from 'dayjs'
import { toast } from 'react-toastify'

import config from '../../config.js'

export const api = axios.create({
    baseURL: config.apiBaseURL,
    timeout: 15 * 1000,
})

// Set by Layout once the user is logged in: returns a valid access token for the
// Homyz API (Auth0 caches it and renews it with the refresh token).
let getAccessToken = null
export const setAccessTokenGetter = (getter) => { getAccessToken = getter }

// Reads are public; every write (POST) is a signed-in action and carries the token.
api.interceptors.request.use(async (request) => {
    if (request.method === 'post') {
        if (!getAccessToken) throw new Error("You must be logged in first.")
        request.headers.Authorization = `Bearer ${await getAccessToken()}`
    }
    return request
})

const errorMessage = (err, fallback) => err?.response?.data?.message || fallback

export const getAllProperties = async () => {
    try {
        const response = await api.get("/residency/getall")
        return response.data
    } catch (err) {
        toast.error(errorMessage(err, "Something went wrong while loading properties."))
        throw err
    }
}

export const getProperty = async (id) => {
    try {
        const response = await api.get(`/residency/${id}`)
        return response.data
    } catch (err) {
        toast.error(errorMessage(err, "Something went wrong while loading this property."))
        throw err
    }
}

export const createUser = async () => {
    await api.post(`/user/register`)
}

export const bookVisit = async (date, propertyId) => {
    await api.post(`/user/bookvisit/${propertyId}`, { date: dayjs(date).format("DD/MM/YYYY") })
}

export const cancelBooking = async (id) => {
    try {
        await api.post(`/user/cancelbooking/${id}`)
    } catch (err) {
        toast.error(errorMessage(err, "Something went wrong. Please try again."))
        throw err
    }
}

export const toFavourites = async (id) => {
    try {
        await api.post(`/user/managefavourites/${id}`)
    } catch (err) {
        toast.error(errorMessage(err, "Something went wrong. Please try again."))
        throw err
    }
}

export const getAllFavourites = async () => {
    try {
        const res = await api.post(`/user/getallfavourites`)
        return res.data["favResidenciesID"]
    } catch (err) {
        toast.error(errorMessage(err, "Something went wrong while fetching favourites."))
        throw err
    }
}

export const getAllBookings = async () => {
    try {
        const res = await api.post(`/user/getallbookings`)
        return res.data["bookedVisits"]
    } catch (err) {
        toast.error(errorMessage(err, "Something went wrong while fetching bookings."))
        throw err
    }
}

// Signs the upload parameters the Cloudinary widget is about to send.
export const signUpload = async (paramsToSign) => {
    const res = await api.post(`/upload/signature`, { paramsToSign })
    return res.data.signature
}

export const createResidency = async (data) => {
    await api.post(`/residency/create`, { data })
}

export { errorMessage }
