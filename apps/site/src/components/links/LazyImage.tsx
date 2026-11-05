"use client";

/**
 * LazyImage – lazy loading nativo + shimmer enquanto carrega.
 * priority = true usa loading="eager" (imagens acima da dobra).
 */
import { useEffect, useRef, useState } from "react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export default function LazyImage({ src, alt, className = "", priority = false }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // No Next a página vem pronta do servidor: a imagem pode terminar de carregar
  // antes de o React ativar o onLoad. Nesse caso, confere o estado ao montar.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete) {
      if (img.naturalWidth > 0) setLoaded(true);
      else setError(true);
    }
  }, []);

  return (
    <div className={`lk-lazy-image-wrapper ${className}`} aria-label={alt}>
      {!loaded && !error && <div className="lk-lazy-shimmer" aria-hidden="true" />}

      {error && (
        <div className="lk-lazy-error" aria-hidden="true">
          <span>Imagem indisponível</span>
        </div>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`lk-lazy-image ${loaded ? "lk-lazy-image--visible" : "lk-lazy-image--hidden"}`}
      />
    </div>
  );
}
