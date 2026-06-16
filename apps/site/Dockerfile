# ---------- Base ----------
FROM node:22-alpine AS base
RUN npm i -g pnpm@9.15.0
WORKDIR /app

# ---------- Dependências ----------
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/site/package.json apps/site/package.json
# --prod=false: garante devDependencies (next, typescript, tailwind) no build,
# mesmo com NODE_ENV=production injetado pelo Coolify.
RUN pnpm install --frozen-lockfile --prod=false --filter @cleci/site...

# ---------- Build ----------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/site/node_modules ./apps/site/node_modules
COPY . .
ENV DOCKER_BUILD=1
# Duração do cookie de atribuição embutida no bundle (deve casar com Admin › Comissões)
ARG NEXT_PUBLIC_ATTRIBUTION_COOKIE_DAYS=30
ENV NEXT_PUBLIC_ATTRIBUTION_COOKIE_DAYS=$NEXT_PUBLIC_ATTRIBUTION_COOKIE_DAYS
RUN pnpm --filter @cleci/site build

# ---------- Runner ----------
FROM base AS runner
ENV NODE_ENV=production
RUN apk add --no-cache wget
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/site/.next/standalone ./
COPY --from=builder /app/apps/site/.next/static ./apps/site/.next/static
COPY --from=builder /app/apps/site/public ./apps/site/public

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ || exit 1

CMD ["node", "apps/site/server.js"]
