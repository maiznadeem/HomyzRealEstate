export const PROPERTY_PLACEHOLDER = "/property-placeholder.svg"

// Property photos can live on other sites that later remove or block them; show a placeholder instead of a broken image.
export const showPlaceholderOnError = (event) => {
    const img = event.currentTarget
    if (!img.src.endsWith(PROPERTY_PLACEHOLDER)) img.src = PROPERTY_PLACEHOLDER
}
