// Public client configuration. Any value can be overridden with a VITE_* env var
// (for example in client/.env.local) to point at a different Auth0 tenant or API.
const env = import.meta.env

const config = {
    domain: env.VITE_AUTH0_DOMAIN || 'dev-ccw5bra5gc5nxss7.us.auth0.com',
    clientID: env.VITE_AUTH0_CLIENT_ID || 'o7gQXTaqFsiQS1RMLLYpqSQF8EFtorQY',
    // The "Homyz Real Estate" API in Auth0; the server checks tokens against it.
    audience: env.VITE_AUTH0_AUDIENCE || 'https://homyz-real-estate-backend.vercel.app/',
    apiBaseURL: env.VITE_API_BASE_URL || 'https://homyz-real-estate-backend.vercel.app/api',
    // Property images go to Cloudinary through a signed preset; the API signs each upload.
    cloudName: env.VITE_CLOUDINARY_CLOUD_NAME || "dwujonydh",
    cloudinaryApiKey: env.VITE_CLOUDINARY_API_KEY || "694932458262786",
    uploadPreset: "homyz_property_images",
    uploadFolder: "Homyz Real Estate",
};

export default config;
