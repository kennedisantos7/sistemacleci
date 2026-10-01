-- Fotos e vídeos do catálogo guardados no próprio banco, no lugar de links
-- externos (imgur). Os campos de foto continuam guardando um endereço; ele passa
-- a ser /media/<id>.<ext>, servido pelo painel a partir desta tabela.

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "sha256" TEXT NOT NULL,
    "sourceUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Media_sha256_key" ON "Media"("sha256");

-- WebP e MP4 já vêm comprimidos: comprimir de novo só gasta CPU. EXTERNAL
-- (sem compressão) também deixa o Postgres ler um TRECHO do vídeo direto do
-- disco — é o que o player do iPhone pede, em pedaços (Range).
ALTER TABLE "Media" ALTER COLUMN "bytes" SET STORAGE EXTERNAL;
