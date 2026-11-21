import config from "../../config.js"

export const PROPERTY_PLACEHOLDER = "/property-placeholder.svg"

// Cloudinary sizes for each place a property photo is shown (2x the CSS size for sharp screens).
const SIZES = {
    card: "c_fill,g_auto,w_480,h_320",
    detail: "c_limit,w_1600,h_1120",
}

// Property photos are stored in Cloudinary; ask it for the right size in the best format
// (WebP/AVIF) and quality for the browser. Anything else is returned unchanged.
export const propertyImageUrl = (url, size = "card") => {
    if (!url) return PROPERTY_PLACEHOLDER
    const prefix = `https://res.cloudinary.com/${config.cloudName}/image/upload/`
    if (!url.startsWith(prefix)) return url
    return `${prefix}f_auto,q_auto,${SIZES[size]}/${url.slice(prefix.length)}`
}

// Show a placeholder instead of a broken image if a photo can't be loaded.
export const showPlaceholderOnError = (event) => {
    const img = event.currentTarget
    if (!img.src.endsWith(PROPERTY_PLACEHOLDER)) img.src = PROPERTY_PLACEHOLDER
}
