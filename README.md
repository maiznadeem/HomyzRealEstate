[![Homyz Banner](https://raw.githubusercontent.com/maiznadeem/HomyzRealEstate/main/client/src/assets/Banner.png)](https://homyz.himaiz.com/)

# Homyz Real Estate

Introducing Homyz - the ultimate real estate platform! Buy or sell properties hassle-free with its user-friendly interface. List your property effortlessly, and explore countless options with a dynamic interactive map. Like your favourite residencies and secure your account with Auth0. Sleek UI powered by Mantine for a seamless experience. Get ready for the real estate adventure of a lifetime!

## Deployment

Homyz Real Estate is live at [**homyz.himaiz.com**](https://homyz.himaiz.com/). This section describes the live setup as of 2026-11-22. The `himaiz.com` Cloudflare zone shared by all of the owner's projects is recorded separately, in the private repo `maiznadeem/OracleVMOps` (`cloudflare/README.md`).

### Hosting and domains

| Hostname | Served by | Behind it |
|---|---|---|
| `homyz.himaiz.com` | Cloudflare Worker `homyz-web`: Workers static assets from `client/dist`, single-page-app fallback, headers in `client/public/_headers` (`client/wrangler.toml`) | nothing (no origin server) |
| `api.homyz.himaiz.com` | Cloudflare Worker `homyz-api-edge` (`edge/api/`), which forwards every request | Cloud Run service `homyz-backend` (`server/`) in Google Cloud project `maiz-portfolio`, region `us-central1` (Iowa): Express 5 on Node 22 in a container (`server/Dockerfile`). It scales to zero and runs at most 2 instances (1 CPU, 512 MiB each). |

- **Data:** MongoDB Atlas, free M0 cluster `maiz-portfolio` on GCP `us-central1` (Iowa), in the Atlas project *Maiz Portfolio US*, reached through Prisma. It moved from `asia-south1` (Mumbai) on 2026-11-22 so it sits in the same region as the API.
- **Images:** Cloudinary (cloud `dwujonydh`). Browsers upload straight to Cloudinary; the API only signs uploads.
- **Sign-in:** Auth0 tenant `homyz-real-estate.us.auth0.com`, using Auth0's hosted login page.
- **Retired on 2026-11-22:** both Vercel projects. The site moved to Cloudflare, and the API (`homyz-real-estate-backend`) moved to Cloud Run. The database moved from Atlas in Mumbai to Iowa, and the old cluster was deleted.

### CI

- **No GitHub Actions workflows.** Pull requests get one check from a GitHub app: GitGuardian scans for leaked secrets.
- **Workers Builds** posts one check per Worker on pushes to `main`. Preview builds are off, so pull requests get no Cloudflare checks.
- **Cloud Build** builds the backend only on pushes to `main` (see CD); pull requests get no Google check.
- **No automated tests.** Prove changes locally before pushing: `npm run build` in `client/`, and for the server, `docker build server` and run the image.
- `main` has no branch protection.

### CD

Every part deploys on its own when `main` changes:

| Part | Deployed by | Settings |
|---|---|---|
| Site (`homyz-web`) | Cloudflare Workers Builds | branch `main`, root `/client`, build `npm run build`, deploy `npx wrangler deploy`, watch path `client/*`, previews off, **no build variables** |
| API Worker (`homyz-api-edge`) | Cloudflare Workers Builds | branch `main`, root `/edge/api`, no build command, deploy `npx wrangler deploy`, watch path `edge/api/*`, previews off, **no build variables** |
| Backend (`homyz-backend`) | Cloud Build trigger `homyz-backend-deploy` in `maiz-portfolio` | runs when a push to `main` changes `server/**`: builds `server/Dockerfile`, pushes the image to Artifact Registry (`cloud-run-source-deploy`), updates the Cloud Run service, then deletes the stored images (Cloud Run keeps its own copy) to stay inside the free storage |

- **Why the site needs no build variables:** the site's public settings (Auth0 domain, client ID and audience, API URL, Cloudinary cloud and key) have production defaults in `client/config.js`. The `VITE_*` overrides are only for local development.
- **Manual fallback:** with `CLOUDFLARE_API_TOKEN` set, run `npm run deploy` in `client/` or `npx wrangler@4 deploy` in `edge/api/`.
- **Backend configuration:** `NODE_ENV`, `ORIGIN_AUTH_MODE` and `CLOUDINARY_CLOUD_NAME` are plain environment variables on the service. Every secret is in the one Secret Manager secret `homyz-secrets` (a JSON object), mounted as `APP_SECRETS` and unpacked by `server/config/appSecrets.js` at startup. Only the service's own account, `homyz-backend@maiz-portfolio.iam.gserviceaccount.com`, can read it.
- **To change a backend secret:** add a new version of `homyz-secrets`, then re-run the deploy trigger: `gcloud builds triggers run homyz-backend-deploy --project maiz-portfolio --branch main`. That builds a fresh image and starts a new revision, which reads the latest version. A settings-only `gcloud run services update` fails, because the build's prune step deletes the image and every new revision has to pull it again. Existing revisions keep their own copy, so routing traffic back to one (see Rollback) still works. Destroy the old secret version once the new revision serves.

**Keep-alive cron:** a Cron Trigger on `homyz-api-edge` (`0 6 * * *`, in `edge/api/wrangler.toml`) runs the Worker's `scheduled()` handler, which calls `GET /api/keepalive`. That runs one small query so Atlas doesn't pause the free cluster.

- **Who can call it:** the cron's request carries the origin secret and an `X-Edge-Cron` header. The Worker strips `X-Edge-Cron` from every visitor request, and the handler requires both, so the public gets 401.
- **If it fails:** the run throws and shows as an error in the Worker's logs (Cloudflare dashboard, `homyz-api-edge`, Logs).
- **To run it on demand:** in `edge/api/`, with `ORIGIN_AUTH` in a local `.dev.vars` file, run `npx wrangler@4 dev --test-scheduled` and open `http://localhost:8787/__scheduled?cron=0+6+*+*+*`. Delete `.dev.vars` afterwards.

### Rollback

- **Site or API Worker:** in the Cloudflare dashboard, open the Worker, then **Deployments**, and roll back to an earlier version. Or run `npx wrangler@4 rollback [version-id]` from the Worker's folder. Also revert the commit, or the next push to that path deploys it again.
- **Backend:** in the Cloud Run console, open `homyz-backend`, then **Revisions**, and send all traffic to an earlier revision. Or run `gcloud run services update-traffic homyz-backend --region us-central1 --project maiz-portfolio --to-revisions <revision>=100`. Also revert the commit, or the next push to `server/` deploys it again.
- **Database:** Atlas M0 has no backups. Take a `mongodump` before risky data changes.
- **Auth0 and Cloudflare zone settings:** these aren't in this repo. Revert them by hand.

### Cloudflare

- **Shared WAF:** both hostnames sit in the shared `himaiz.com` zone, behind its WAF:
  - the Cloudflare Free Managed Ruleset
  - custom rules that block scanner paths (such as `/.env`) and unused HTTP methods
  - SSL Full (strict), minimum TLS 1.2, Always Use HTTPS

  These zone rules serve every project on the zone and are managed centrally (see the `OracleVMOps` record above). Don't change them from this project.
- **`api.homyz.himaiz.com` is a machine host.** The zone's rule for API hosts skips Browser Integrity Check and Security Level challenges, so API calls are never challenged.
- **Origin lock for the API ("Pattern A"):** the API only answers requests that came through Cloudflare.
  - **The Worker** (`edge/api/index.js`) removes any copies of its headers that the visitor sent, then sets:
    - `X-Origin-Auth`: the Worker secret `ORIGIN_AUTH`
    - `X-Client-IP`: from `CF-Connecting-IP`
    - `X-Forwarded-Host` and `X-Forwarded-Proto`

    It builds the target from its `ORIGIN` variable, copying only the path and query, so a request can't redirect it to another host.
  - **The middleware** `server/middleware/originAuth.js` runs first in the chain and compares `X-Origin-Auth` with `ORIGIN_AUTH` in constant time:
    - With `ORIGIN_AUTH_MODE=enforce`, which is set in production, every other request gets 403.
    - Any other mode only logs.
    - Without `ORIGIN_AUTH` the check is off, as in local development.
  - **The rate limiter** trusts `X-Client-IP` only when the secret matches.
- **The site ("Pattern B"):** static assets on Workers, so there's no origin server to bypass. `workers_dev` and `preview_urls` are off. No Worker script runs for the site, so its traffic doesn't count against the account's daily Worker request quota. API requests do count.
- **Cloud Run's side:** the service allows unauthenticated invocations, because the Worker can't present Google credentials, so the origin lock is what keeps direct `*.run.app` requests out.

### Logging

Both parts follow the shared logging standard (`LOGGING.md` in `maiznadeem/OracleVMOps`). Every line is one JSON object with `time`, `level`, `app` (`homyz`), `part` (`api` or `edge`), `event`, `ray` and `msg`.

- **Requests:** one line per request at each part, with `method`, `route` (the route pattern, such as `/api/residency/:id`, never the raw path), `status` and `ms`.
  - The API adds the Auth0 user id (`user`) when the request is signed in; it never logs the email.
  - Health checks, the keep-alive and CORS preflights log at `debug`. Every 5xx and exception logs at `error` with `event=exception`.
- **One id across both parts:** the edge Worker forwards the visitor's `CF-Ray` to the API as `X-CF-Ray`, after deleting any copy the visitor sent. Cloudflare gives the Worker's own call a new `CF-Ray`, so the API logs `X-CF-Ray` as `ray`. Filter on one ray to see a request at both parts.
- **Never logged:** bodies, cookies, tokens, `Authorization` headers or emails. Errors log their type, code and stack frames, not their message, because database errors can quote a query. Keys that look like a secret or an email are redacted.
- **Where:** the API in Cloud Logging (`homyz-backend`), the edge in the Worker's logs. `LOG_LEVEL` (default `info`) sets the API's minimum level.

### Secrets

Names only; the values never go in the repo.

| Name | Where it lives | Used for |
|---|---|---|
| `ORIGIN_AUTH` | Secret Manager `homyz-secrets`, and a Worker secret on `homyz-api-edge` | origin lock |
| `DATABASE_URL` | Secret Manager `homyz-secrets` | MongoDB connection, as user `homyz-app` |
| `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Secret Manager `homyz-secrets` | signing image uploads |
| `DOMAIN`, `CLIENT_ID`, `CLIENT_SECRET` | Auth0 Action secrets on *Homyz Real Estate - link accounts by email* | the Action's machine-to-machine app (read and update users) |

- **Not secrets:** `ORIGIN_AUTH_MODE`, `CLOUDINARY_CLOUD_NAME` and `NODE_ENV`, set on the Cloud Run service. Cloud Run sets `PORT`.
- **Public by design:** the Auth0 and Cloudinary identifiers in `client/config.js`.
- **Deploys:** Workers Builds uses the account's shared build token, and Cloud Build uses the project's default build service account. There are no GitHub Actions secrets.

### Auth0

- **Tenant:** `homyz-real-estate.us.auth0.com`, single-page application "Homyz".
- **Allowed Callback URLs:** `https://homyz.himaiz.com` and `https://homyz.himaiz.com/`.
- **Allowed Logout URLs, Allowed Web Origins and Allowed Origins (CORS):** only `https://homyz.himaiz.com`.
- **Never add `localhost`;** see Run on Local Machine.
- **Logos:** the login page and the app logo load from `homyz.himaiz.com` (`/logo2.png`, `/Homyz%20Logo.png`).
- **API audience:** `https://homyz-real-estate-backend.vercel.app/`. It is only an identifier and doesn't change with the API's hostname.

### Bot protection

- **No Cloudflare bot product is used.** The zone's Bot Fight Mode is off on purpose: the Free plan can't exempt API clients from it. Turnstile isn't needed, because Homyz has no anonymous forms of its own. Contact is a `mailto:` link, and every write needs a login.
- **Sign-up and login** happen on Auth0's hosted page, under Auth0 Attack Protection (checked 2026-11-22): bot detection at medium level, challenging risky logins, sign-ups and password resets; brute-force protection that blocks after 10 failed attempts; and suspicious-IP throttling, which allows 10 sign-ups per IP and adds one back every 6 minutes. Breached-password detection is a paid feature and is off.
- **The API** applies its own rate limits and per-account data caps (see Security and abuse limits).
- **No zone rate-limit rule** covers Homyz, since it has no login endpoints of its own.

### Data access

- **The API's database user** is `homyz-app`, with `readWrite` on `Homyz-Database` only. That database holds the `Residency`, `User`, `RateLimit` (expires on its own) and `UploadNonce` collections.
- **The cluster** also hosts the procurement app's database, with its own user. Its network access isn't IP-restricted, because Cloud Run has no fixed outbound addresses without a paid NAT. Per-app credentials and TLS protect it.
- **Images** live in Cloudinary's *Homyz Real Estate* folder, written only through the signed upload preset.

## Key Features

- **Discover Dream Properties**: Uncover your perfect home with Homyz's powerful property search. Explore any location and its surroundings on an interactive map.
- **Love It, Save It**: Fall in love with properties? Simply hit the heart button to save them to your personalized favourites list for future delight.
- **Fortress of Security**: Your data is guarded by Auth0, ensuring a rock-solid and seamless user authentication experience.
- **Unlock Exclusive Features**: Create an account, log in, and open the door to exclusive features, saving preferences, and personalized experiences.

## Technologies

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Javascript](https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E)
![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/json%20web%20tokens-323330?style=for-the-badge&logo=json-web-tokens&logoColor=pink)
![Google Cloud Run](https://img.shields.io/badge/Google%20Cloud%20Run-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![VS Code](https://img.shields.io/badge/Visual_Studio_Code-0078D4?style=for-the-badge&logo=visual%20studio%20code&logoColor=white)


- **React**: Empowering UI Magic. A dynamic JavaScript library for creating captivating user interfaces with ease.
- **Node.js**: Unleashing Server-Side Potential. A powerful runtime environment enabling lightning-fast back-end development.
- **Express**: Streamlined Web Applications. An agile Node.js framework simplifying server-side coding for web applications.
- **MongoDB**: Rock-Solid Data Storage. A cutting-edge NoSQL database ensuring secure and reliable data storage.
- **Auth0**: Fortified Authentication. A top-tier third-party service providing robust user authentication for enhanced security.
- **Mantine**: Beauty in UI Components. A treasure trove of React components for crafting polished and stunning user interfaces.

## Run on Local Machine

1. Clone the repository and install dependencies:

```bash
git clone https://github.com/maiznadeem/HomyzRealEstate.git
cd HomyzRealEstate
cd client && npm install
cd ../server && npm install
```

2. Create `server/.env`:

```
PORT=8000
DATABASE_URL=your_mongodb_url_here
CORS_ORIGINS=http://localhost:3000
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

   `CORS_ORIGINS` lists the sites allowed to call the API (default: the deployed site only). `ORIGIN_AUTH` and `ORIGIN_AUTH_MODE` are production-only (see Deployment); leave them unset locally. The Cloudinary key signs image uploads; without it, property image uploads are disabled. Optional overrides: `CLOUDINARY_CLOUD_NAME` (default `dwujonydh`), `AUTH0_ISSUER_BASE_URL` (default `https://homyz-real-estate.us.auth0.com`) and `AUTH0_AUDIENCE` (default `https://homyz-real-estate-backend.vercel.app/`).

3. Create `client/.env.local` to point the client at your local server:

```
VITE_API_BASE_URL=http://localhost:8000/api
```

   `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID` and `VITE_AUTH0_AUDIENCE` override the defaults in `client/config.js` if you use your own Auth0 tenant.

4. Start both apps:

```bash
cd server && npm run dev
cd client && npm run dev
```

5. Open `http://localhost:3000`. The API runs on `http://localhost:8000`.

   Deployed environments allow only production origins. The site's Auth0 application and the API's CORS list contain only the production site, and the backend has no preview deployments. Don't add `localhost` to the production Auth0 application. To log in locally, create a separate development application (or tenant) that allows `http://localhost:3000`, and point the `VITE_AUTH0_*` variables in `client/.env.local` at it. Browsing listings works locally without logging in.

### Auth0 setup

The client logs in with the Auth0 SPA application and requests an access token for the **Homyz Real Estate** API (`https://homyz-real-estate-backend.vercel.app/`). A post-login Action, *Homyz Real Estate - email claim*, adds the user's verified email to that token as `https://homyz-real-estate/email`, and the server uses that claim, never an email sent in the request, to decide whose favourites and bookings to read or change. A second post-login Action, *Homyz Real Estate - link accounts by email*, runs first and keeps one account per person: when someone logs in with a verified email that another verified account already uses (for example Google and then email + password), it links the two into the oldest account. The site's tenant is `homyz-real-estate.us.auth0.com`. If you use your own tenant:

- Add your deployed URL to the application's Allowed Callback URLs, Allowed Logout URLs and Allowed Web Origins. Use a separate development application for `http://localhost:3000`.
- Create an API, enable **Allow Offline Access** (the client uses refresh tokens), and use its identifier as the audience.
- Create the post-login Action that sets the `https://homyz-real-estate/email` claim for verified emails.

### Database

The server uses Prisma with MongoDB Atlas on the free M0 tier. Atlas pauses free clusters after long inactivity, so the API Worker's daily cron calls `GET /api/keepalive`, which runs one small query (see Deployment, CD). If the site still shows "Something went wrong" while loading properties, resume the cluster in Atlas.

Use a database user limited to the app's database (role `readWrite` on `Homyz-Database`), not one with access to every database on the cluster.

### Security and abuse limits

- **Accounts:** every user action needs an Auth0 access token whose verified email the server reads from the token. Unverified emails can browse but not act.
- **Image uploads:** property photos upload straight to Cloudinary through the signed preset `homyz_property_images`, which stores them in the *Homyz Real Estate* folder, accepts only jpg, png and webp, and caps them at 2000 px. The API (`POST /api/upload/signature`) signs each upload only for a logged-in user, only for that preset and folder, only for an upload starting now, and only once per random image id; the preset never overwrites, so a replayed signature cannot create a second image.
- **Rate limits** (shared across serverless instances through a `RateLimit` collection in MongoDB that expires on its own): 300 API requests per 15 minutes per IP; 120 signed-in actions per 15 minutes per account; 5 new properties per day per account and 15 per IP; 15 image uploads per hour per account and 40 per IP.
- **Data caps:** at most 20 properties, 200 favourites and 50 bookings per account, and favourites and bookings must point at real properties.
- **Validation:** property fields have length and range limits, prices and room counts must be whole numbers, visit dates must fall within the next year, and property images must be Cloudinary URLs from the site's folder.
- **Headers and CORS:** `helmet` sets security headers on the API and `client/public/_headers` sets a CSP and other headers on the site; browsers may only call the API from the deployed site, and request bodies are limited to 20 KB.
- **Origin lock:** the API only answers requests that came through Cloudflare (see Deployment).
- **Privacy:** public property reads don't include the owner's email address.

**Contributing**

Contributions to this project are welcomed. If you wish to contribute, please follow the standard GitHub workflow by creating pull requests and discussing any proposed changes via issues.

**Reporting Issues**

If you encounter any issues while using the Homyz website or have any suggestions for improvement, please open an issue on the GitHub repository. Your feedback is valuable to us, and we will address any reported issues promptly.

---

## Contact

Maiz - contact.maiznadeem@gmail.com

Project Link: [View Github](https://github.com/maiznadeem/HomyzRealEstate)