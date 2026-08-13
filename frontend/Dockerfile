# ============================================================
# Frontend Dockerfile — React / Vite + Nginx
# Multi-stage build (Node build → Nginx runtime)
# ============================================================

# ─────────────────────────────────────────────────────────────
# Stage 1: Build
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

LABEL stage="builder"

WORKDIR /app

# Install dependencies first for layer caching
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --no-audit

# Copy entire source
COPY . .

# Build the production bundle
RUN npm run build \
 && echo "Build complete — listing dist:" \
 && ls -lh dist/

# ─────────────────────────────────────────────────────────────
# Stage 2: Runtime (Nginx)
# ─────────────────────────────────────────────────────────────
FROM nginx:1.25-alpine AS runtime

LABEL maintainer="engineering@docs.internal"
LABEL version="1.0.0"
LABEL description="Google Docs Clone — React Frontend"

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy SPA-specific nginx config
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf

# Fix permissions
RUN chown -R nginx:nginx /usr/share/nginx/html \
 && chmod -R 755 /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
