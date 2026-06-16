# ---------- Base ----------
FROM node:22-alpine AS base
RUN npm i -g pnpm@9.15.0
WORKDIR /app

# ---------- Build ----------
# Instala as deps no próprio estágio (evita copiar node_modules entre estágios,
# o que quebra os symlinks por-pacote do pnpm).
FROM base AS builder
ENV DOCKER_BUILD=1
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/site/package.json apps/site/package.json
# --prod=false: garante devDependencies mesmo com NODE_ENV=production (Coolify).
RUN pnpm install --frozen-lockfile --prod=false --filter @cleci/site...
COPY . .
# Variáveis públicas embutidas no bundle em build-time.
ARG NEXT_PUBLIC_ATTRIBUTION_COOKIE_DAYS=30
ENV NEXT_PUBLIC_ATTRIBUTION_COOKIE_DAYS=$NEXT_PUBLIC_ATTRIBUTION_COOKIE_DAYS
# URL do sistema (painel) para o botão "Entrar".
ARG NEXT_PUBLIC_SISTEMA_URL=http://localhost:3001
ENV NEXT_PUBLIC_SISTEMA_URL=$NEXT_PUBLIC_SISTEMA_URL
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
