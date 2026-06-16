#!/bin/sh
set -e

# Aplica migrations pendentes no start, a menos que desativado (RUN_MIGRATIONS=0).
# Usa o CLI global do Prisma + o schema copiado para a imagem.
if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
  echo "→ Aplicando migrations (prisma migrate deploy)..."
  prisma migrate deploy --schema=packages/db/prisma/schema.prisma
fi

exec "$@"
