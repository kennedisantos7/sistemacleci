# ---------- Base ----------
FROM node:22-alpine AS base
RUN corepack enable || npm i -g pnpm@9.15.0
WORKDIR /app

# ---------- Dependências ----------
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/sistema/package.json apps/sistema/package.json
COPY packages/db/package.json packages/db/package.json
# --prod=false: garante devDependencies (prisma, next, typescript, tailwind)
# mesmo quando o Coolify injeta NODE_ENV=production no build.
RUN pnpm install --frozen-lockfile --prod=false

# ---------- Build ----------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Prisma Client precisa ser gerado antes do build
ENV DOCKER_BUILD=1
RUN pnpm --filter @cleci/db generate
RUN pnpm --filter @cleci/sistema build

# ---------- Runner ----------
FROM base AS runner
ENV NODE_ENV=production
# CLI do Prisma global (independente do pnpm) para rodar migrations no start
RUN npm i -g prisma@6.19.3 && apk add --no-cache wget openssl
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Output standalone do Next.js
COPY --from=builder /app/apps/sistema/.next/standalone ./
COPY --from=builder /app/apps/sistema/.next/static ./apps/sistema/.next/static
COPY --from=builder /app/apps/sistema/public ./apps/sistema/public
# Schema para migrate deploy no start
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY apps/sistema/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3001
ENV PORT=3001 HOSTNAME=0.0.0.0

# Healthcheck para o Coolify
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/api/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "apps/sistema/server.js"]
