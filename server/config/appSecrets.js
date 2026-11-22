// On Cloud Run every secret arrives in one Secret Manager secret, mounted as APP_SECRETS (a JSON object of
// strings). index.js imports this module first, so the values are in place before any other module reads them.
if (process.env.APP_SECRETS) {
    Object.assign(process.env, JSON.parse(process.env.APP_SECRETS))
    delete process.env.APP_SECRETS
}
