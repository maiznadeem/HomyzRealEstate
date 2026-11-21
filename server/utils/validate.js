import { httpError } from './http.js'
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_FOLDER } from '../config/cloudinaryConfig.js'

// Control and invisible formatting characters (zero-width spaces and the like); newlines are fine.
const INVISIBLE = /[\p{Cc}\p{Cf}]/u

const text = (value, field, min, max) => {
    if (typeof value !== 'string') throw httpError(400, `${field} is required.`)
    const trimmed = value.trim()
    if (INVISIBLE.test(trimmed.replace(/[\r\n\t]/g, ''))) throw httpError(400, `${field} contains characters that aren't allowed.`)
    if (trimmed.length < min || trimmed.length > max) {
        throw httpError(400, `${field} must be between ${min} and ${max} characters.`)
    }
    return trimmed
}

const integer = (value, field, min, max) => {
    const number = Number(value)
    if (!Number.isInteger(number) || number < min || number > max) {
        throw httpError(400, `${field} must be a whole number between ${min} and ${max}.`)
    }
    return number
}

// Only images uploaded through the site's signed preset are accepted: exactly
// https://res.cloudinary.com/<cloud>/image/upload/v<version>/<folder>/<id>.<ext>, with no
// transformations, query string or path tricks.
const IMAGE_PATH = new RegExp(
    `^/${CLOUDINARY_CLOUD_NAME}/image/upload/v\\d+/${encodeURIComponent(CLOUDINARY_FOLDER)}/[A-Za-z0-9_-]{1,64}\\.(jpg|jpeg|png|webp)$`
)

const propertyImage = (value) => {
    let url
    try {
        url = new URL(value)
    } catch {
        throw httpError(400, 'Please upload a property image.')
    }
    if (url.protocol !== 'https:' || url.host !== 'res.cloudinary.com' || url.search || url.hash || !IMAGE_PATH.test(url.pathname)) {
        throw httpError(400, 'Please upload the property image through the site.')
    }
    return `${url.origin}${url.pathname}`
}

export const residencyInput = (data = {}) => ({
    title: text(data.title, 'Title', 3, 100),
    description: text(data.description, 'Description', 3, 2000),
    price: integer(data.price, 'Price', 1, 1_000_000_000),
    address: text(data.address, 'Address', 3, 200),
    city: text(data.city, 'City', 3, 100),
    country: text(data.country, 'Country', 3, 100),
    image: propertyImage(data.image),
    facilities: {
        bedrooms: integer(data.facilities?.bedrooms, 'Bedrooms', 1, 50),
        bathrooms: integer(data.facilities?.bathrooms, 'Bathrooms', 1, 50),
        parkings: integer(data.facilities?.parkings ?? 0, 'Parkings', 0, 50),
    },
})

// Visit dates come as DD/MM/YYYY and must be from today up to a year ahead.
export const visitDate = (value) => {
    const match = typeof value === 'string' && /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
    if (!match) throw httpError(400, 'A visit date is required.')
    const [, day, month, year] = match.map(Number)
    const date = new Date(Date.UTC(year, month - 1, day))
    if (date.getUTCDate() !== day || date.getUTCMonth() !== month - 1) throw httpError(400, 'That visit date is not valid.')
    const today = new Date()
    const startOfToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - 24 * 60 * 60 * 1000
    if (date.getTime() < startOfToday || date.getTime() > Date.now() + 366 * 24 * 60 * 60 * 1000) {
        throw httpError(400, 'Please pick a visit date within the next year.')
    }
    return value
}
