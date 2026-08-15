-- Unifica "Tabela de preços" e "Produtos" numa seção só.
--
-- O cadastro passa a ser o PriceItem (é ele que tem código único e é o que o
-- orçamento consome). Ele ganha foto, categoria/subtipo de verdade — no lugar
-- do texto solto em "group" — e o vínculo com a vitrine do site.
--
-- Nada é apagado: o catálogo do site (Product) continua onde está, e produto
-- que não casar com nenhum código segue editável pela aba "somente no site".

ALTER TABLE "PriceItem" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "PriceItem" ADD COLUMN "categoryId" TEXT;
ALTER TABLE "PriceItem" ADD COLUMN "subcategoryId" TEXT;
ALTER TABLE "PriceItem" ADD COLUMN "siteProductId" TEXT;

-- --------------------------------------------------------------------------
-- Backfill 1: "group" (texto) -> categoria de verdade, quando o nome bater.
-- Comparação sem caixa e sem espaço nas pontas: a planilha escreve "TAPETES",
-- o catálogo escreve "Tapetes".
-- --------------------------------------------------------------------------
UPDATE "PriceItem" p
   SET "categoryId" = c.id
  FROM "Category" c
 WHERE p."group" IS NOT NULL
   AND upper(btrim(p."group")) = upper(btrim(c."name"));

-- --------------------------------------------------------------------------
-- Backfill 2: liga ao produto do site que já existe, casando por código —
-- é o "as que já estão no site deixe já ativas".
--
-- DISTINCT ON: Product.code não é único; se dois produtos do site tiverem o
-- mesmo código, vence o de menor posição (o que aparece primeiro na vitrine),
-- e o desempate por id mantém o resultado estável entre execuções.
-- --------------------------------------------------------------------------
WITH escolhido AS (
  SELECT DISTINCT ON (upper(btrim(pr."code")))
         upper(btrim(pr."code")) AS chave,
         pr.id,
         pr."imageUrl",
         pr."categoryId",
         pr."subcategoryId"
    FROM "Product" pr
   WHERE pr."code" IS NOT NULL
     AND btrim(pr."code") <> ''
   ORDER BY upper(btrim(pr."code")), pr."position" ASC, pr.id ASC
)
UPDATE "PriceItem" p
   SET "siteProductId" = e.id,
       -- A foto da vitrine vira a foto do cadastro. COALESCE por garantia:
       -- se um dia esta migração rodar depois de alguém preencher à mão, o
       -- valor digitado ganha.
       "imageUrl"      = COALESCE(p."imageUrl", e."imageUrl"),
       "categoryId"    = COALESCE(p."categoryId", e."categoryId"),
       "subcategoryId" = COALESCE(p."subcategoryId", e."subcategoryId")
  FROM escolhido e
 WHERE upper(btrim(p."code")) = e.chave;

-- --------------------------------------------------------------------------
-- Restrições depois do backfill: um produto do site pertence a um cadastro só.
-- --------------------------------------------------------------------------
CREATE UNIQUE INDEX "PriceItem_siteProductId_key" ON "PriceItem"("siteProductId");
CREATE INDEX "PriceItem_categoryId_active_idx" ON "PriceItem"("categoryId", "active");

ALTER TABLE "PriceItem"
  ADD CONSTRAINT "PriceItem_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PriceItem"
  ADD CONSTRAINT "PriceItem_subcategoryId_fkey"
  FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PriceItem"
  ADD CONSTRAINT "PriceItem_siteProductId_fkey"
  FOREIGN KEY ("siteProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
