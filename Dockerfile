# ======================================================
# EDYRA — Root Multi-Stage Build Orchestrator
# This file is used for unified Docker builds.
# Individual services have their own Dockerfiles.
# ======================================================

# Stage 1: Backend Build
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY backend/ ./

# Stage 2: Frontend Build
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci && npm cache clean --force
COPY frontend/ ./
ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

# Stage 3: Backend Runtime
FROM node:20-alpine AS backend
RUN apk add --no-cache dumb-init
ENV NODE_ENV=production
WORKDIR /app/backend

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs edyra

COPY --from=backend-builder --chown=edyra:nodejs /app/backend ./
RUN mkdir -p uploads && chown -R edyra:nodejs uploads

USER edyra
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]

# Stage 4: Frontend Runtime  
FROM node:20-alpine AS frontend
RUN apk add --no-cache dumb-init
ENV NODE_ENV=production
WORKDIR /app/frontend

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/.next/static ./.next/static
COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/public ./public

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => process.exit(r.statusCode < 500 ? 0 : 1))" || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
