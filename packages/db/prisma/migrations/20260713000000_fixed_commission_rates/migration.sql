-- Taxas fixas do programa de afiliados (bps), alteráveis só pelo DESENVOLVEDOR.
-- 800 = 8% (venda fechada no gateway), 300 = 3% (apenas indicação),
-- 1000 = 10% (participação do desenvolvedor, usada em relatório).
ALTER TABLE "CommissionConfig" ADD COLUMN IF NOT EXISTS "afiliadoVendaBps" INTEGER NOT NULL DEFAULT 800;
ALTER TABLE "CommissionConfig" ADD COLUMN IF NOT EXISTS "afiliadoIndicacaoBps" INTEGER NOT NULL DEFAULT 300;
ALTER TABLE "CommissionConfig" ADD COLUMN IF NOT EXISTS "desenvolvedorBps" INTEGER NOT NULL DEFAULT 1000;

-- Uma venda passa a poder gerar duas comissões (afiliado + desenvolvedor).
-- A unicidade migra de saleId para o par (saleId, userId).
DROP INDEX IF EXISTS "Commission_saleId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Commission_saleId_userId_key" ON "Commission"("saleId", "userId");
