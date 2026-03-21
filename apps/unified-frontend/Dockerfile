# =============================================================================
# NeuroOps Unified Platform — Unified Frontend Dockerfile
# Multi-stage build: Node builder → Nginx static server
#
# PRODUCTION (default):
#   docker build -t neuroops-frontend .
#   Serves the compiled Vite bundle via Nginx on port 80.
#
# DEVELOPMENT:
#   Developers run `npm run dev` locally (or via docker-compose.dev.yml override)
#   which starts the Vite HMR dev server on port 5173.
#   No need to build this image during development.
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1 — Builder
# ---------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for better layer caching
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci --prefer-offline

# Copy full source tree
COPY . .

# Build the production bundle (output to /app/dist)
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2 — Runtime (Nginx static file server)
# ---------------------------------------------------------------------------
FROM nginx:1.25-alpine AS runtime

# Remove default nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy our custom SPA-friendly nginx config
COPY nginx-frontend.conf /etc/nginx/conf.d/default.conf

# Remove the default nginx.conf server block (we manage via conf.d)
RUN rm -f /etc/nginx/conf.d/default.conf.bak 2>/dev/null || true

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
