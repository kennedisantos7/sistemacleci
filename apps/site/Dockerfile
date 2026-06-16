# ---------- Base ----------
FROM node:22-alpine AS base
RUN npm i -g pnpm@9.15.0
WORKDIR /app

# ---------- Dependências ----------
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/site/package.json apps/site/package.json
COPY packages/db/package.json packages/db/package.json
RUN pnpm install --frozen-lockfile --filter @cleci/site...

# ---------- Build ----------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/site/node_modules ./apps/site/node_modules
COPY . .
# VITE_* são embutidas no bundle em build-time
ARG VITE_ATTRIBUTION_COOKIE_DAYS=30
ENV VITE_ATTRIBUTION_COOKIE_DAYS=$VITE_ATTRIBUTION_COOKIE_DAYS
RUN pnpm --filter @cleci/site build

# ---------- Runner (nginx servindo SPA) ----------
FROM nginx:alpine AS runner
COPY apps/site/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/site/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
