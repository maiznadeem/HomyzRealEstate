const priceFormat = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })

export const formatPrice = (price) => (Number.isFinite(Number(price)) ? priceFormat.format(Number(price)) : "")

// "1 bedroom", "3 bedrooms"
export const plural = (count, singular, pluralForm = `${singular}s`) => `${count} ${Number(count) === 1 ? singular : pluralForm}`

// Visit dates are stored as DD/MM/YYYY; show them as "12 Dec 2026".
export const formatVisitDate = (value) => {
    const match = typeof value === "string" && /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
    if (!match) return value || ""
    const date = new Date(Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1])))
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
}
