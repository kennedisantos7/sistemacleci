-- Base de clientes compartilhada + titularidade com prazo + histórico.

-- 1) Titularidade opcional: cliente sem titular está livre para ser assumido.
ALTER TABLE "Client" ALTER COLUMN "vendedorId" DROP NOT NULL;

-- Remover um vendedor passa a LIBERAR a carteira dele, não apagá-la.
-- (Com Cascade, excluir um vendedor apagaria as empresas — e falharia de todo
-- jeito quando houvesse orçamento, porque Budget->Client não tem cascade.)
ALTER TABLE "Client" DROP CONSTRAINT IF EXISTS "Client_vendedorId_fkey";
ALTER TABLE "Client"
  ADD CONSTRAINT "Client_vendedorId_fkey"
  FOREIGN KEY ("vendedorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 2) Relógio da titularidade.
ALTER TABLE "Client" ADD COLUMN "ownerSince" TIMESTAMP(3);
ALTER TABLE "Client" ADD COLUMN "lastActivityAt" TIMESTAMP(3);

-- Backfill: quem já é titular hoje continua titular, com o prazo contado a
-- partir do sinal de trabalho mais recente (edição da ficha ou orçamento).
-- Sem isso, todo cliente antigo nasceria vencido e liberado no primeiro acesso.
UPDATE "Client" c
SET "ownerSince" = c."createdAt",
    "lastActivityAt" = GREATEST(
      c."updatedAt",
      COALESCE((SELECT MAX(b."updatedAt") FROM "Budget" b WHERE b."clientId" = c."id"), c."updatedAt")
    )
WHERE c."vendedorId" IS NOT NULL;

-- 3) Índices de busca: agora todo vendedor pesquisa a base inteira.
CREATE INDEX "Client_name_idx" ON "Client"("name");
CREATE INDEX "Client_companyName_idx" ON "Client"("companyName");
CREATE INDEX "Client_lastActivityAt_idx" ON "Client"("lastActivityAt");

-- 4) Histórico de contatos e atividades.
CREATE TYPE "ClientActivityType" AS ENUM (
  'LIGACAO', 'WHATSAPP', 'EMAIL', 'REUNIAO', 'VISITA', 'PROPOSTA', 'OBSERVACAO', 'SISTEMA'
);

CREATE TABLE "ClientActivity" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "userId" TEXT,
  "authorName" TEXT,
  "type" "ClientActivityType" NOT NULL,
  "note" VARCHAR(2000),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClientActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClientActivity_clientId_createdAt_idx" ON "ClientActivity"("clientId", "createdAt");

ALTER TABLE "ClientActivity"
  ADD CONSTRAINT "ClientActivity_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Autor sai, histórico fica (o nome vai em snapshot na própria linha).
ALTER TABLE "ClientActivity"
  ADD CONSTRAINT "ClientActivity_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
