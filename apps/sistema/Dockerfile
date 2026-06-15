# ---------- Base ----------
FROM node:22-alpine AS base
RUN corepack enable || npm i -g pnpm@9.15.0
WORKDIR /app

# ---------- Dependências ----------
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/sistema/package.json apps/sistema/package.json
COPY packages/db/package.json packages/db/package.json
RUN pnpm install --frozen-lockfile

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
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Output standalone do Next.js
COPY --from=builder /app/apps/sistema/.next/standalone ./
COPY --from=builder /app/apps/sistema/.next/static ./apps/sistema/.next/static
COPY --from=builder /app/apps/sistema/public ./apps/sistema/public
# Prisma engines + schema para migrate deploy no start
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma

USER nextjs
EXPOSE 3001
ENV PORT=3001 HOSTNAME=0.0.0.0
CMD ["node", "apps/sistema/server.js"]
