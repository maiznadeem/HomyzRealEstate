[![Homyz Banner](https://raw.githubusercontent.com/maiznadeem/HomyzRealEstate/main/client/src/assets/Banner.png)](https://homyz.himaiz.com/)

# Homyz Real Estate

Introducing Homyz - the ultimate real estate platform! Buy or sell properties hassle-free with its user-friendly interface. List your property effortlessly, and explore countless options with a dynamic interactive map. Like your favourite residencies and secure your account with Auth0. Sleek UI powered by Mantine for a seamless experience. Get ready for the real estate adventure of a lifetime!

## Deployment

Homyz Real Estate is live at [**homyz.himaiz.com**](https://homyz.himaiz.com/). This section describes the live setup as of 2026-11-22. The `himaiz.com` Cloudflare zone shared by all of the owner's projects is recorded separately, in the private repo `maiznadeem/OracleVMOps` (`cloudflare/README.md`).

### Hosting and domains

| Hostname | Served by | Behind it |
|---|---|---|
| `homyz.himaiz.com` | Cloudflare Worker `homyz-web`: Workers static assets from `client/dist`, single-page-app fallback, headers in `client/public/_headers` (`client/wrangler.toml`) | nothing (no origin server) |
| `api.homyz.himaiz.com` | Cloudflare Worker `homyz-api-edge` (`edge/api/`), which forwards every request | Vercel project `homyz-real-estate-backend` (`server/`): Express 5 on Node 22.x serverless functions in region `iad1` (Washington, D.C.), at `homyz-real-estate-backend.vercel.app` |

- **Data:** MongoDB Atlas, free M0 cluster on GCP `asia-south1` (Mumbai), reached through Prisma.
- **Images:** Cloudinary (cloud `dwujonydh`). Browsers upload straight to Cloudinary; the API only signs uploads.
- **Sign-in:** Auth0 tenant `homyz-real-estate.us.auth0.com`, using Auth0's hosted login page.
- **Retired:** the old Vercel web project (`homyz-real-estate.vercel.app`) was deleted on 2026-11-22. Only the backend project is left on Vercel.

### CI

- **No GitHub Actions workflows.** Pull requests get three checks from GitHub apps:
  - GitGuardian scans for leaked secrets.
  - Vercel builds a preview of the backend.
  - Vercel Preview Comments.
- **Workers Builds** posts one check per Worker on pushes to `main`. Preview builds are off, so pull requests get no Cloudflare checks.
- **No automated tests.** Prove changes locally before pushing: `npm run build` in `client/`, and start the server.
- `main` has no branch protection.

### CD

Every part deploys on its own when `main` changes:

| Part | Deployed by | Settings |
|---|---|---|
| Site (`homyz-web`) | Cloudflare Workers Builds | branch `main`, root `/client`, build `npm run build`, deploy `npx wrangler deploy`, watch path `client/*`, previews off, **no build variables** |
| API Worker (`homyz-api-edge`) | Cloudflare Workers Builds | branch `main`, root `/edge/api`, no build command, deploy `npx wrangler deploy`, watch path `edge/api/*`, previews off, **no build variables** |
| Backend (`homyz-real-estate-backend`) | Vercel's GitHub integration | root `server/`. `main` deploys to production; other branches get a preview. Vercel currently builds the backend on every push, including ones that only touch `client/`, `edge/` or docs. |

- **Why the site needs no build variables:** the site's public settings (Auth0 domain, client ID and audience, API URL, Cloudinary cloud and key) have production defaults in `client/config.js`. The `VITE_*` overrides are only for local development.
- **Manual fallback:** with `CLOUDFLARE_API_TOKEN` set, run `npm run deploy` in `client/` or `npx wrangler@4 deploy` in `edge/api/`.

**Keep-alive cron:** `server/vercel.json` schedules `GET /api/keepalive` at `0 6 * * *`. On Vercel Hobby the run lands at some point between 06:00 and 06:59 UTC. It runs one small query so Atlas doesn't pause the free cluster.

- **How it passes the origin lock:** Vercel calls the production deployment directly, not through Cloudflare, so the request has no `X-Origin-Auth`. The origin-lock middleware exempts this one path. The handler then requires `Authorization: Bearer <CRON_SECRET>`, compared in constant time, and otherwise returns 401.
- **To run it on demand:** `vercel crons run /api/keepalive -p homyz-real-estate-backend`.
- **To read the result:** `vercel logs requests -p homyz-real-estate-backend --since 10m --query "requestPath:/api/keepalive"`.

### Rollback

- **Site or API Worker:** in the Cloudflare dashboard, open the Worker, then **Deployments**, and roll back to an earlier version. Or run `npx wrangler@4 rollback [version-id]` from the Worker's folder. Also revert the commit, or the next push to that path deploys it again.
- **Backend:** in Vercel, use **Instant Rollback**. On Hobby it only goes back to the previous production deployment, so for anything older, revert the commit on `main`. A rollback also restores that deployment's cron definition and its copy of `CRON_SECRET`.
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
    - With `ORIGIN_AUTH_MODE=enforce`, which is set in production, every other request gets 403. The one exception is `/api/keepalive` (see CD).
    - Any other mode only logs.
    - Without `ORIGIN_AUTH` the check is off, as in local development and previews.
  - **The rate limiter** trusts `X-Client-IP` only when the secret matches.
- **The site ("Pattern B"):** static assets on Workers, so there's no origin server to bypass. `workers_dev` and `preview_urls` are off. No Worker script runs for the site, so its traffic doesn't count against the account's daily Worker request quota. API requests do count.
- **Vercel's side:** no Vercel Firewall rules. Deployment Protection (Vercel Authentication) is on for previews, so preview URLs ask for a Vercel login.

### Secrets

Names only; the values never go in the repo.

| Name | Where it lives | Used for |
|---|---|---|
| `ORIGIN_AUTH` | Vercel production (Sensitive), and a Worker secret on `homyz-api-edge` | origin lock |
| `ORIGIN_AUTH_MODE` | Vercel production (Sensitive) | origin lock mode (`enforce`) |
| `DATABASE_URL` | Vercel production and preview (Sensitive) | MongoDB connection, as user `homyz-app` |
| `CRON_SECRET` | Vercel production and preview (Sensitive) | keep-alive cron |
| `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Vercel production and preview (Sensitive) | signing image uploads |
| `DOMAIN`, `CLIENT_ID`, `CLIENT_SECRET` | Auth0 Action secrets on *Homyz Real Estate - link accounts by email* | the Action's machine-to-machine app (read and update users) |

- **Not secrets:** `CLOUDINARY_CLOUD_NAME` and `PORT` on Vercel.
- **Public by design:** the Auth0 and Cloudinary identifiers in `client/config.js`.
- **Cloudflare deploys:** Workers Builds uses the account's shared build token. There are no GitHub Actions secrets.

### Auth0

- **Tenant:** `homyz-real-estate.us.auth0.com`, single-page application "Homyz".
- **Allowed Callback URLs:** `https://homyz.himaiz.com` and `https://homyz.himaiz.com/`.
- **Allowed Logout URLs, Allowed Web Origins and Allowed Origins (CORS):** only `https://homyz.himaiz.com`.
- **Never add `localhost`;** see Run on Local Machine.
- **Logos:** the login page and the app logo load from `homyz.himaiz.com` (`/logo2.png`, `/Homyz%20Logo.png`).
- **API audience:** `https://homyz-real-estate-backend.vercel.app/`. It is only an identifier and doesn't change with the API's hostname.

### Bot protection

- **No Cloudflare bot product is used.** The zone's Bot Fight Mode is off on purpose: the Free plan can't exempt API clients from it. Turnstile isn't needed, because Homyz has no anonymous forms of its own. Contact is a `mailto:` link, and every write needs a login.
- **Sign-up and login** happen on Auth0's hosted page, under Auth0 Attack Protection: bot detection when traffic looks risky, and sign-up throttling.
- **The API** applies its own rate limits and per-account data caps (see Security and abuse limits).
- **No zone rate-limit rule** covers Homyz, since it has no login endpoints of its own.

### Data access

- **The API's database user** is `homyz-app`, with `readWrite` on `Homyz-Database` only. That database holds the `Residency`, `User`, `RateLimit` (expires on its own) and `UploadNonce` collections.
- **The cluster** also hosts other apps' databases, each with its own user. Its network access isn't IP-restricted, because Vercel Hobby has no fixed outbound addresses. Per-app credentials and TLS protect it.
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
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
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
CRON_SECRET=a_long_random_string
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

   Deployed environments allow only production origins. The site's Auth0 application and the API's CORS list contain only the production site, and Vercel preview deployments can't call the production API. Don't add `localhost` to the production Auth0 application. To log in locally, create a separate development application (or tenant) that allows `http://localhost:3000`, and point the `VITE_AUTH0_*` variables in `client/.env.local` at it. Browsing listings works locally without logging in.

### Auth0 setup

The client logs in with the Auth0 SPA application and requests an access token for the **Homyz Real Estate** API (`https://homyz-real-estate-backend.vercel.app/`). A post-login Action, *Homyz Real Estate - email claim*, adds the user's verified email to that token as `https://homyz-real-estate/email`, and the server uses that claim, never an email sent in the request, to decide whose favourites and bookings to read or change. A second post-login Action, *Homyz Real Estate - link accounts by email*, runs first and keeps one account per person: when someone logs in with a verified email that another verified account already uses (for example Google and then email + password), it links the two into the oldest account. The site's tenant is `homyz-real-estate.us.auth0.com`. If you use your own tenant:

- Add your deployed URL to the application's Allowed Callback URLs, Allowed Logout URLs and Allowed Web Origins. Use a separate development application for `http://localhost:3000`.
- Create an API, enable **Allow Offline Access** (the client uses refresh tokens), and use its identifier as the audience.
- Create the post-login Action that sets the `https://homyz-real-estate/email` claim for verified emails.

### Database

The server uses Prisma with MongoDB Atlas on the free M0 tier. Atlas pauses free clusters after long inactivity, so a daily Vercel cron (`crons` in `server/vercel.json`) calls `GET /api/keepalive`, which runs one small query. Vercel sends `Authorization: Bearer $CRON_SECRET`; without `CRON_SECRET` set the endpoint always returns 401. If the site still shows "Something went wrong" while loading properties, resume the cluster in Atlas.

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