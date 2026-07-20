# Deploy no Coolify

A plataforma sobe como **3 recursos** no Coolify, todos ligados ao mesmo PostgreSQL:

| Recurso        | O que é                        | Porta interna |
| -------------- | ------------------------------ | ------------- |
| `postgres`     | Banco PostgreSQL (+ PgBouncer) | 5432 / 6432   |
| `cleci-sistema`| Painéis + API (Next.js)        | 3001          |
| `cleci-site`   | Site público (Next.js Node)    | 3000          |

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
MP_ACCESS_TOKEN=APP_USR-...
MP_WEBHOOK_SECRET=<assinatura secreta do webhook>
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

### Webhook do Mercado Pago

No painel de desenvolvedores do Mercado Pago (Suas integrações → aplicação →
Webhooks), aponte o endpoint para
`https://sistema.clecipersonalizados.com.br/api/webhooks/mercadopago` e
assine o evento `payment`. Copie a "Assinatura secreta" exibida na mesma tela
para `MP_WEBHOOK_SECRET`.

## 3. Serviço `cleci-site`

Site público em **Next.js (Node standalone)** — não é mais estático/nginx.

- **Build**: Dockerfile `apps/site/Dockerfile`, contexto = raiz do repo.
- **Porta**: 3000. **Healthcheck** embutido (GET `/`).
- **Build arg** (embutido no bundle em build-time):
  `NEXT_PUBLIC_ATTRIBUTION_COOKIE_DAYS=30` (deve casar com Admin › Comissões).
- **Variáveis de ambiente** (runtime):

```
NODE_ENV=production
SITE_URL=https://clecipersonalizados.com.br
SISTEMA_URL=https://sistema.clecipersonalizados.com.br
INGEST_API_KEY=<a MESMA chave do sistema>
NEXT_PUBLIC_ATTRIBUTION_COOKIE_DAYS=30
```

> `INGEST_API_KEY` e `SISTEMA_URL` são usados **apenas no servidor** (route
> `/api/checkout`). Só `NEXT_PUBLIC_*` vai para o navegador.

## 4. Integração site → sistema (checkout)

O botão **Comprar agora** (produtos com `priceCents`) chama a rota server-side
`POST /api/checkout` do **site**, que lê o cookie `cleci_ref` e repassa para
`POST /api/sales/ingest` do **sistema** com `x-api-key: <INGEST_API_KEY>` e
`createCheckout: true`. O sistema cria a venda (atribuída ao afiliado), gera a
Preference (Checkout Pro) do Mercado Pago e devolve a `checkoutUrl`; o
navegador é redirecionado ao Mercado Pago e volta para `/sucesso` ou
`/cancelado`.

- A chave **nunca** vai para o bundle do navegador (fica na route do site).
- Mantenha `INGEST_API_KEY` idêntica nos dois serviços.
- Produtos sem `priceCents` seguem apenas com orçamento via WhatsApp.

## Checklist de produção

- [ ] PgBouncer ativo e `DATABASE_URL` com `?pgbouncer=true`
- [ ] `AUTH_SECRET` forte e único
- [ ] Webhook do Mercado Pago assinado e testado (simulador → 200)
- [ ] `INGEST_API_KEY` igual nos dois lados, fora do bundle do navegador
- [ ] Site com `SISTEMA_URL` + `INGEST_API_KEY` (runtime) e `NEXT_PUBLIC_ATTRIBUTION_COOKIE_DAYS` (build)
- [ ] Checkout testado de ponta a ponta: comprar → Mercado Pago → `/sucesso` → venda PAGO + comissão
- [ ] `cookieDurationDays` (Admin › Comissões) batendo com `NEXT_PUBLIC_ATTRIBUTION_COOKIE_DAYS`
- [ ] Seed do admin executado e senha trocada
- [ ] Domínios/HTTPS configurados (HSTS já é enviado pelo app)
- [ ] Rate limit do ingest: para múltiplas réplicas, migrar de memória para Redis
