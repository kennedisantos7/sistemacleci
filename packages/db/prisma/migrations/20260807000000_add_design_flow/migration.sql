-- Login de DESIGN + fluxo de arte do orçamento.
--
-- O fluxo é OPCIONAL: designStatus NULL significa que o orçamento nunca foi
-- para o design, e ele segue a cadeia normal sem nada disso. Por isso é uma
-- coluna à parte, e não um valor novo dentro de BudgetStatus — misturar as
-- duas obrigaria todo orçamento a passar pelo design.

ALTER TYPE "Role" ADD VALUE 'DESIGN';

CREATE TYPE "DesignStatus" AS ENUM (
  'SOLICITADO', 'EM_PRODUCAO', 'ENTREGUE', 'REVISAO', 'APROVADA'
);

ALTER TABLE "Budget" ADD COLUMN "designStatus" "DesignStatus";
ALTER TABLE "Budget" ADD COLUMN "designRequestedAt" TIMESTAMP(3);
ALTER TABLE "Budget" ADD COLUMN "designDeliveredAt" TIMESTAMP(3);
ALTER TABLE "Budget" ADD COLUMN "designBrief" VARCHAR(2000);
ALTER TABLE "Budget" ADD COLUMN "designerNote" VARCHAR(2000);
ALTER TABLE "Budget" ADD COLUMN "designRequestedById" TEXT;
ALTER TABLE "Budget" ADD COLUMN "designerId" TEXT;

-- Sem backfill de propósito: orçamento existente não pediu arte, então
-- designStatus NULL é exatamente o estado correto para todos eles.

CREATE INDEX "Budget_designStatus_designRequestedAt_idx"
  ON "Budget"("designStatus", "designRequestedAt");

-- Tirar um usuário do sistema não pode apagar o pedido de arte.
ALTER TABLE "Budget"
  ADD CONSTRAINT "Budget_designRequestedById_fkey"
  FOREIGN KEY ("designRequestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Budget"
  ADD CONSTRAINT "Budget_designerId_fkey"
  FOREIGN KEY ("designerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Arte: uma linha por versão entregue. Revisão não apaga a anterior.
--
-- O arquivo vai no próprio banco (bytea) por decisão temporária: o código de
-- upload em S3 já existe, mas o ambiente não tem credenciais configuradas.
-- Migrar depois é trocar "data" por uma URL.
CREATE TABLE "BudgetArt" (
  "id" TEXT NOT NULL,
  "budgetId" TEXT NOT NULL,
  "data" BYTEA NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "widthPx" INTEGER,
  "heightPx" INTEGER,
  "version" INTEGER NOT NULL,
  "current" BOOLEAN NOT NULL DEFAULT true,
  "uploadedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BudgetArt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BudgetArt_budgetId_version_key" ON "BudgetArt"("budgetId", "version");
CREATE INDEX "BudgetArt_budgetId_current_idx" ON "BudgetArt"("budgetId", "current");

ALTER TABLE "BudgetArt"
  ADD CONSTRAINT "BudgetArt_budgetId_fkey"
  FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BudgetArt"
  ADD CONSTRAINT "BudgetArt_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
