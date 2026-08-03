-- Confirmação de e-mail no cadastro próprio + login com Google.

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");
CREATE INDEX "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId");
CREATE INDEX "EmailVerificationToken_expiresAt_idx" ON "EmailVerificationToken"("expiresAt");

-- AddForeignKey
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Backfill OBRIGATÓRIO: a partir de agora o login por senha exige e-mail
-- confirmado. Todas as contas criadas antes desta migração foram cadastradas
-- ou aprovadas manualmente pelo admin, então valem como confirmadas — sem
-- isto, o admin de produção (e toda a equipe) ficaria trancado para fora.
-- ---------------------------------------------------------------------------
UPDATE "User" SET "emailVerified" = CURRENT_TIMESTAMP WHERE "emailVerified" IS NULL;
