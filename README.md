# Cleci — Monorepo

Plataforma da **Cleci Personalizados**: site público + Sistema de Afiliação e Gestão de Vendas.

## Estrutura

```
cleci/
├── apps/
│   ├── site/        # site público (catálogo) — leitura de ?ref=, cookie de atribuição
│   └── sistema/     # Next.js App Router — painéis RBAC (Admin/Vendedor/Afiliado) + API/webhooks
├── packages/
│   ├── db/          # Prisma schema + client (fonte única do banco)
│   ├── auth/        # configuração Auth.js + RBAC compartilhado
│   └── config/      # tsconfig/eslint compartilhados
└── turbo.json
```

## Stack

- **Next.js (App Router)** — front + back do sistema
- **PostgreSQL** (Coolify) + **Prisma** (ORM)
- **Auth.js (NextAuth)** com RBAC (ADMIN / DESENVOLVEDOR / GERENTE / VENDEDOR_FIXO / AFILIADO)
- **Tailwind CSS + Shadcn/UI**
- **Mercado Pago** (checkout + webhooks); comissão via saldo virtual + saque manual

## Como rodar (dev)

```bash
docker compose up -d          # sobe Postgres (5432) + PgBouncer (6432)
pnpm install
cp .env.example .env          # já alinhado com o docker-compose
pnpm db:generate              # gera o Prisma Client
pnpm db:migrate               # cria as tabelas
pnpm db:seed                  # cria o admin inicial + config
pnpm dev                      # sobe site (3000) e sistema (3001)
```

Testes do núcleo financeiro: `pnpm --filter @cleci/sistema test`.
Deploy em produção: ver [DEPLOY.md](DEPLOY.md).

## Valores monetários

Todos os valores são armazenados em **centavos (Int)**. Taxas de comissão em
**pontos-base (bps)**: `1500 = 15%`. Nunca usar `Float` para dinheiro.

## Deploy (Coolify)

Cada app tem seu próprio `Dockerfile` (multi-stage) e vira um serviço independente
apontando para o mesmo PostgreSQL. Use **PgBouncer** (`DATABASE_URL`) para o runtime
e conexão direta (`DIRECT_URL`) para migrations.
