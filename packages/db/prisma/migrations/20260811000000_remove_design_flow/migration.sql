-- Remove o fluxo de arte/design. O sistema fica só com criação de pedido e
-- orçamento: nada de enviar para o design, anexar arte ou aprovar peça.
--
-- Desfaz por inteiro a 20260807000000_add_design_flow: tabela de artes,
-- colunas design* do orçamento, o enum DesignStatus e o papel DESIGN.

-- 1) Artes anexadas e as colunas do fluxo. Os arquivos moravam no próprio
--    banco (bytea), então o DROP TABLE já leva tudo — não sobra órfão.
DROP TABLE IF EXISTS "BudgetArt";

DROP INDEX IF EXISTS "Budget_designStatus_designRequestedAt_idx";

ALTER TABLE "Budget" DROP CONSTRAINT IF EXISTS "Budget_designRequestedById_fkey";
ALTER TABLE "Budget" DROP CONSTRAINT IF EXISTS "Budget_designerId_fkey";

ALTER TABLE "Budget" DROP COLUMN IF EXISTS "designStatus";
ALTER TABLE "Budget" DROP COLUMN IF EXISTS "designRequestedAt";
ALTER TABLE "Budget" DROP COLUMN IF EXISTS "designDeliveredAt";
ALTER TABLE "Budget" DROP COLUMN IF EXISTS "designBrief";
ALTER TABLE "Budget" DROP COLUMN IF EXISTS "designerNote";
ALTER TABLE "Budget" DROP COLUMN IF EXISTS "designRequestedById";
ALTER TABLE "Budget" DROP COLUMN IF EXISTS "designerId";

DROP TYPE IF EXISTS "DesignStatus";

-- 2) O papel DESIGN. Contas que ainda o tinham viram vendedor BLOQUEADO em vez
--    de sumirem: apagar o usuário levaria junto orçamentos e histórico de
--    auditoria. Bloqueado, o login não entra e o admin decide o que fazer.
UPDATE "User"
   SET "role" = 'VENDEDOR_FIXO', "status" = 'BLOQUEADO'
 WHERE "role" = 'DESIGN';

-- Postgres não remove valor de enum: recria o tipo sem DESIGN e troca a coluna.
ALTER TYPE "Role" RENAME TO "Role_old";

CREATE TYPE "Role" AS ENUM ('ADMIN', 'DESENVOLVEDOR', 'GERENTE', 'VENDEDOR_FIXO', 'AFILIADO');

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "Role" USING ("role"::text::"Role");
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'AFILIADO';

DROP TYPE "Role_old";
