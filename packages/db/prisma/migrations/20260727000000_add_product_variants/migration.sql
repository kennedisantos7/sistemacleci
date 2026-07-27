-- Linhas/versões do produto (ex.: sacolas de papel Premium/Popular/Plastificada).
-- Cada item: {name, image?, description?, sizes?, codes?}

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "variants" JSONB;
