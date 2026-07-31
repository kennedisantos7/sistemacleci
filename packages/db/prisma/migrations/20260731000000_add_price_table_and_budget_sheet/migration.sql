-- Orçamento/Pedido no formato da planilha:
--  * PriceItem: tabela de preços (código, descrição, unidade, valor)
--  * Client: campos de endereço/contato do bloco impresso
--  * Budget: tipo do documento, cabeçalho do pedido e ajustes do rodapé
--  * BudgetItem: produto vinculado, dimensões (m²) e valor parcial

-- CreateEnum
CREATE TYPE "PriceUnit" AS ENUM ('M2', 'UNIDADE', 'PACOTE', 'MILHEIRO');

-- CreateEnum
CREATE TYPE "BudgetDocType" AS ENUM ('ORCAMENTO', 'PEDIDO');

-- CreateEnum
CREATE TYPE "AdjustmentMode" AS ENUM ('VALOR', 'PERCENTUAL');

-- CreateTable
CREATE TABLE "PriceItem" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" "PriceUnit" NOT NULL DEFAULT 'UNIDADE',
    "priceCents" INTEGER NOT NULL,
    "group" TEXT,
    "searchText" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PriceItem_code_key" ON "PriceItem"("code");
CREATE INDEX "PriceItem_active_position_idx" ON "PriceItem"("active", "position");
CREATE INDEX "PriceItem_group_idx" ON "PriceItem"("group");
CREATE INDEX "PriceItem_searchText_idx" ON "PriceItem"("searchText");

-- AlterTable: Client (endereço/contato)
ALTER TABLE "Client"
    ADD COLUMN "whatsapp" TEXT,
    ADD COLUMN "contactName" TEXT,
    ADD COLUMN "address" TEXT,
    ADD COLUMN "city" TEXT,
    ADD COLUMN "state" TEXT,
    ADD COLUMN "zip" TEXT;

-- AlterTable: Budget (documento, cabeçalho e ajustes)
ALTER TABLE "Budget"
    ADD COLUMN "docType" "BudgetDocType" NOT NULL DEFAULT 'ORCAMENTO',
    ADD COLUMN "paymentTerms" TEXT,
    ADD COLUMN "deliveryForecast" TEXT,
    ADD COLUMN "deliveryCity" TEXT,
    ADD COLUMN "discountMode" "AdjustmentMode" NOT NULL DEFAULT 'VALOR',
    ADD COLUMN "discountInput" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "discountCents" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "surchargeMode" "AdjustmentMode" NOT NULL DEFAULT 'VALOR',
    ADD COLUMN "surchargeInput" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "surchargeCents" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "freightMode" "AdjustmentMode" NOT NULL DEFAULT 'VALOR',
    ADD COLUMN "freightInput" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "freightCents" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "taxMode" "AdjustmentMode" NOT NULL DEFAULT 'VALOR',
    ADD COLUMN "taxInput" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "taxCents" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: BudgetItem (produto, dimensões, valor parcial)
ALTER TABLE "BudgetItem"
    ADD COLUMN "priceItemId" TEXT,
    ADD COLUMN "code" TEXT,
    ADD COLUMN "unit" "PriceUnit" NOT NULL DEFAULT 'UNIDADE',
    ADD COLUMN "widthM" DECIMAL(10,3),
    ADD COLUMN "lengthM" DECIMAL(10,3),
    ADD COLUMN "areaM2" DECIMAL(12,4),
    ADD COLUMN "partialCents" INTEGER NOT NULL DEFAULT 0;

-- Itens já existentes: o valor parcial é o próprio preço unitário.
UPDATE "BudgetItem" SET "partialCents" = "unitPriceCents" WHERE "partialCents" = 0;

-- CreateIndex
CREATE INDEX "BudgetItem_priceItemId_idx" ON "BudgetItem"("priceItemId");

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_priceItemId_fkey"
    FOREIGN KEY ("priceItemId") REFERENCES "PriceItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
