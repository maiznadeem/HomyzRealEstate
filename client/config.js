// Public client configuration. Any value can be overridden with a VITE_* env var
// (for example in client/.env.local) to point at a different Auth0 tenant or API.
const env = import.meta.env

const config = {
    domain: env.VITE_AUTH0_DOMAIN || 'homyz-real-estate.us.auth0.com',
    clientID: env.VITE_AUTH0_CLIENT_ID || 'zp5pITppkg9r3dRAhYCQZcg92grND5nb',
    // The "Homyz Real Estate" API in Auth0; the server checks tokens against it.
    audience: env.VITE_AUTH0_AUDIENCE || 'https://homyz-real-estate-backend.vercel.app/',
    apiBaseURL: env.VITE_API_BASE_URL || 'https://api.homyz.himaiz.com/api',
    // Property images go to Cloudinary through a signed preset; the API signs each upload.
    cloudName: env.VITE_CLOUDINARY_CLOUD_NAME || "dwujonydh",
    cloudinaryApiKey: env.VITE_CLOUDINARY_API_KEY || "694932458262786",
    uploadPreset: "homyz_property_images",
    uploadFolder: "Homyz Real Estate",
};

export default config;
