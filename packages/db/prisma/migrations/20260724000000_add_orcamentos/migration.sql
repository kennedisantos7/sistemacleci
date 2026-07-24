-- Orçamentos do vendedor: cadastro de clientes, orçamentos e itens.

-- Nova origem de venda: orçamento aceito pelo vendedor.
ALTER TYPE "SaleOrigin" ADD VALUE IF NOT EXISTS 'ORCAMENTO';

-- CreateEnum
CREATE TYPE "BudgetStatus" AS ENUM ('RASCUNHO', 'ENVIADO', 'ACEITO', 'RECUSADO', 'EXPIRADO');

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "vendedorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "document" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "vendedorId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "BudgetStatus" NOT NULL DEFAULT 'RASCUNHO',
    "title" TEXT,
    "note" TEXT,
    "validUntil" TIMESTAMP(3),
    "subtotalCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "saleId" TEXT,
    "sentAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetItem" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unitPriceCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Client_vendedorId_name_idx" ON "Client"("vendedorId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_number_key" ON "Budget"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_saleId_key" ON "Budget"("saleId");

-- CreateIndex
CREATE INDEX "Budget_vendedorId_status_idx" ON "Budget"("vendedorId", "status");

-- CreateIndex
CREATE INDEX "Budget_clientId_idx" ON "Budget"("clientId");

-- CreateIndex
CREATE INDEX "BudgetItem_budgetId_position_idx" ON "BudgetItem"("budgetId", "position");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
