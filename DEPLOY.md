# Deploy no Coolify

A plataforma sobe como **3 recursos** no Coolify, todos ligados ao mesmo PostgreSQL:

| Recurso        | O que é                        | Porta interna |
| -------------- | ------------------------------ | ------------- |
| `postgres`     | Banco PostgreSQL (+ PgBouncer) | 5432 / 6432   |
| `cleci-sistema`| Painéis + API (Next.js)        | 3001          |
| `cleci-site`   | Site público (Vite + nginx)    | 80            |

## 1. Banco de dados

Crie um **PostgreSQL** no Coolify. Habilite **PgBouncer** (pooling) — fundamental
para o Next.js não esgotar conexões. Guarde duas URLs:

- **Pooled** (PgBouncer) → `DATABASE_URL` (runtime). Acrescente `?pgbouncer=true`.
- **Direta** (5432) → `DIRECT_URL` (apenas migrations).

## 2. Serviço `cleci-sistema`

- **Build**: Dockerfile `apps/sistema/Dockerfile`, contexto = raiz do repo.
- **Porta**: 3001. **Healthcheck** já embutido (`/api/health`).
- **Migrations**: o entrypoint roda `prisma migrate deploy` no start
  (desative com `RUN_MIGRATIONS=0` se preferir rodar manualmente).
- **Variáveis de ambiente**:

```
NODE_ENV=production
DATABASE_URL=postgresql://...@pgbouncer:6432/cleci?pgbouncer=true
DIRECT_URL=postgresql://...@postgres:5432/cleci
AUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=https://sistema.clecipersonalizados.com.br
SITE_URL=https://clecipersonalizados.com.br
SISTEMA_URL=https://sistema.clecipersonalizados.com.br
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
INGEST_API_KEY=<chave aleatória forte>
```

### Primeiro deploy (admin inicial)

Rode o seed uma única vez a partir de uma máquina/CI com o repositório (o
container standalone não inclui o `tsx`), apontando para o banco de produção:

```
DATABASE_URL=postgresql://...@host:5432/cleci \
SEED_ADMIN_EMAIL=admin@clecipersonalizados.com.br \
SEED_ADMIN_PASSWORD=<senha forte> \
pnpm db:seed
```

> Troque a senha do admin no primeiro acesso.

### Webhook do Stripe

No painel do Stripe, aponte o endpoint para
`https://sistema.clecipersonalizados.com.br/api/webhooks/stripe` e assine os
eventos: `checkout.session.completed`, `payment_intent.succeeded`,
`payment_intent.payment_failed`, `charge.refunded`. Copie o `whsec_...` para
`STRIPE_WEBHOOK_SECRET`.

## 3. Serviço `cleci-site`

- **Build**: Dockerfile `apps/site/Dockerfile`, contexto = raiz do repo.
- **Porta**: 80.
- **Build arg** (opcional): `VITE_ATTRIBUTION_COOKIE_DAYS=30` (deve casar com a
  duração configurada em Admin › Comissões).

## 4. Integração site → sistema

O site envia pedidos de checkout para `POST /api/sales/ingest` no sistema,
autenticando com o header `x-api-key: <INGEST_API_KEY>`. Configure a mesma chave
nos dois serviços (no site, como variável de build/runtime do backend que fizer
a chamada — nunca exponha a chave no bundle do navegador).

## Checklist de produção

- [ ] PgBouncer ativo e `DATABASE_URL` com `?pgbouncer=true`
- [ ] `AUTH_SECRET` forte e único
- [ ] Webhook do Stripe assinado e testado (evento de teste → 200)
- [ ] `INGEST_API_KEY` igual nos dois lados, fora do bundle do navegador
- [ ] Seed do admin executado e senha trocada
- [ ] Domínios/HTTPS configurados (HSTS já é enviado pelo app)
- [ ] Rate limit do ingest: para múltiplas réplicas, migrar de memória para Redis
