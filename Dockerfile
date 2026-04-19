# =====================================================================
# Apex GEO/AEO Platform — Dockerfile (Plan 5)
# Multi-stage build for Next.js standalone production output
# Uses bun (matches the project's bun.lock + bun-managed deps).
# =====================================================================

# Stage 1: Dependencies (cached unless package.json/bun.lock changes)
FROM oven/bun:1-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Stage 2: Builder
FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Release tagging for Sentry/Bugsink (BL-55)
ARG GIT_SHA=""
ARG NEXT_PUBLIC_GIT_SHA=""
ENV GIT_SHA=${GIT_SHA}
ENV NEXT_PUBLIC_GIT_SHA=${NEXT_PUBLIC_GIT_SHA}

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN bun run build

# Stage 3: Runner — minimal Node runtime serving Next standalone output
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

ARG GIT_SHA=""
ENV GIT_SHA=${GIT_SHA}

# Non-root user for runtime
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built assets — leverages Next.js standalone output tracing
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
