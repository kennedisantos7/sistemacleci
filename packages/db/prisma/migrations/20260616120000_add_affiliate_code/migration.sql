-- AlterTable
ALTER TABLE "User" ADD COLUMN "affiliateCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_affiliateCode_key" ON "User"("affiliateCode");
