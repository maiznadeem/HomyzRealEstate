export const httpError = (status, message) => Object.assign(new Error(message), { status })

export const isObjectId = (id) => typeof id === "string" && /^[a-f\d]{24}$/i.test(id)
