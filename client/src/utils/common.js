export const updateFavourites = (id, favourites) => {
    if (favourites?.includes(id))
        return favourites.filter(resID => resID !== id)
    else
        return [...(favourites ?? []), id]
}

// Visit dates are stored as DD/MM/YYYY. Returns a local Date at midnight, or null.
export const parseVisitDate = (value) => {
    const match = typeof value === "string" && /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
    return match ? new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1])) : null
}

export const isPastVisit = (value) => {
    const date = parseVisitDate(value)
    if (!date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
}

export const validateString = (value) => {
    return value?.length < 3 || value == null ? "Must be at least 3 characters" : null
}