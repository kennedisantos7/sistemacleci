const FOTO_DO_BANCO = /\/media\/[a-z0-9]{20,40}\.(webp|jpg|png|avif)$/;

/**
 * Miniatura de uma foto guardada no banco (`/media/<id>.webp?w=160`). Link
 * externo, GIF e vídeo voltam como estão — não há versão reduzida deles.
 */
export function miniatura(url: string | null | undefined, largura: 96 | 160 | 320 | 640): string {
  if (!url) return "";
  return FOTO_DO_BANCO.test(url) ? `${url}?w=${largura}` : url;
}
