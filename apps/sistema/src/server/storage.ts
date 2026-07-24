import { randomBytes } from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/env";

let _client: S3Client | null = null;

export function isStorageConfigured(): boolean {
  return Boolean(
    env.S3_ENDPOINT &&
      env.S3_BUCKET &&
      env.S3_ACCESS_KEY_ID &&
      env.S3_SECRET_ACCESS_KEY &&
      env.S3_PUBLIC_URL,
  );
}

function getClient(): S3Client {
  if (_client) return _client;
  if (!isStorageConfigured()) throw new Error("Armazenamento de imagens não configurado.");
  _client = new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID!,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
    },
  });
  return _client;
}

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Sobe uma imagem para o bucket e devolve a URL pública. Valida tipo/tamanho.
 */
export async function uploadImage(file: File): Promise<string> {
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) throw new Error("Formato inválido. Use JPG, PNG, WEBP, GIF ou AVIF.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Imagem muito grande (máx. 5 MB).");

  const key = `produtos/${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  const body = new Uint8Array(await file.arrayBuffer());

  await getClient().send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET!,
      Key: key,
      Body: body,
      ContentType: file.type,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return `${env.S3_PUBLIC_URL!.replace(/\/$/, "")}/${key}`;
}
