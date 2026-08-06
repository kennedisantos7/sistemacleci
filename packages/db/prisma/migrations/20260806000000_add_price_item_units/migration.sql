-- Um produto da tabela de preços pode ter valor por m², por pacote e por
-- unidade ao mesmo tempo. PriceItem.unit/priceCents continuam existindo como a
-- unidade PRINCIPAL (a pré-selecionada no orçamento) e são sempre um espelho de
-- uma das linhas abaixo.

CREATE TABLE "PriceItemPrice" (
  "id" TEXT NOT NULL,
  "priceItemId" TEXT NOT NULL,
  "unit" "PriceUnit" NOT NULL,
  "priceCents" INTEGER NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "PriceItemPrice_pkey" PRIMARY KEY ("id")
);

-- Uma linha por unidade: trocar o valor é editar a existente, não somar outra.
CREATE UNIQUE INDEX "PriceItemPrice_priceItemId_unit_key"
  ON "PriceItemPrice"("priceItemId", "unit");
CREATE INDEX "PriceItemPrice_priceItemId_position_idx"
  ON "PriceItemPrice"("priceItemId", "position");

ALTER TABLE "PriceItemPrice"
  ADD CONSTRAINT "PriceItemPrice_priceItemId_fkey"
  FOREIGN KEY ("priceItemId") REFERENCES "PriceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: cada produto existente vira uma linha com a unidade e o valor que
-- já tinha. Sem isso todo produto da tabela ficaria sem nenhum preço listado.
INSERT INTO "PriceItemPrice" ("id", "priceItemId", "unit", "priceCents", "position")
SELECT
  -- gen_random_uuid vem do pgcrypto, disponível por padrão no Postgres 13+.
  replace(gen_random_uuid()::text, '-', ''),
  p."id",
  p."unit",
  p."priceCents",
  0
FROM "PriceItem" p;
