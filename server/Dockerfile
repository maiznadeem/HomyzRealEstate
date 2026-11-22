# Cloud Run image for the API (built by the Cloud Build trigger on pushes to main that change server/).
FROM node:22-bookworm-slim

# Prisma's query engine needs OpenSSL. tini forwards Cloud Run's SIGTERM so instances stop cleanly.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates tini \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
WORKDIR /app

# The schema has to be present for the postinstall `prisma generate`.
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npm cache clean --force

COPY . .
USER node

EXPOSE 8080
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "index.js"]
