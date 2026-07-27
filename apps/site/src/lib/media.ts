import { type MediaItem, type Product } from "../components/ui/ProductCard";

export type { MediaItem };

const VIDEO_EXT = /\.(mp4|webm|mov|m4v)(\?.*)?$/i;

export function isVideoUrl(url: string): boolean {
  return VIDEO_EXT.test(url);
}

export function toMediaItem(url: string): MediaItem {
  return { type: isVideoUrl(url) ? "video" : "image", url };
}

/**
 * Lista ordenada de mídias do produto (imagens e vídeos).
 * Usa `media` quando definido; senão monta a partir de `image` + `images`,
 * sempre com a imagem principal em primeiro e sem duplicatas.
 */
export function productMedia(product: Product): MediaItem[] {
  if (product.media && product.media.length > 0) return product.media;

  const urls = [product.image, ...(product.images ?? [])].filter(Boolean);
  const unique = Array.from(new Set(urls));
  return unique.map(toMediaItem);
}
