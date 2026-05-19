################ deps ################
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

################ build ################
FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build the standalone bundle. Generates .next/standalone + .next/static.
RUN npm run build

################ runner ################
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# tini = proper signal handling; curl + bash = cron driver.
RUN apk add --no-cache tini curl bash tzdata coreutils \
 && addgroup -g 1001 -S nodejs \
 && adduser  -u 1001 -S nextjs -G nodejs

# Standalone server + assets.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Internal cron driver.
COPY --chown=nextjs:nodejs docker/entrypoint.sh /usr/local/bin/entrypoint.sh
COPY --chown=nextjs:nodejs docker/cron.sh /usr/local/bin/cron.sh
RUN chmod +x /usr/local/bin/entrypoint.sh /usr/local/bin/cron.sh

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/api/cron/status || exit 1

ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/entrypoint.sh"]
