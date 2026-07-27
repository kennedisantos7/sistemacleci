"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { type MediaItem } from "../../lib/media";

interface MediaCarouselProps {
  items: MediaItem[];
  alt: string;
  /** Classe do container (altura/proporção fica por conta de quem usa). */
  className?: string;
  /** Classe aplicada em cada mídia (ex.: object-contain + efeitos de hover). */
  mediaClassName?: string;
  imageLoading?: "lazy" | "eager";
  /** Vídeos com controles nativos (usado na página de detalhe). */
  videoControls?: boolean;
}

/**
 * Carrossel horizontal com scroll-snap: arrasta no touch, setas no desktop
 * e pontinhos indicando a posição. Renderiza imagens e vídeos na ordem recebida.
 */
export default function MediaCarousel({
  items,
  alt,
  className = "",
  mediaClassName = "",
  imageLoading = "lazy",
  videoControls = false,
}: MediaCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  useEffect(() => {
    // Reposiciona no primeiro item quando a lista muda (ex.: troca de linha).
    trackRef.current?.scrollTo({ left: 0 });
    setIndex(0);
  }, [items]);

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const target = Math.max(0, Math.min(items.length - 1, i));
    el.scrollTo({ left: target * el.clientWidth, behavior: "smooth" });
  };

  if (items.length === 0) return null;

  const single = items.length === 1;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        ref={trackRef}
        onScroll={onScroll}
        className={`flex h-full w-full ${
          single ? "" : "snap-x snap-mandatory overflow-x-auto hide-scrollbar"
        }`}
      >
        {items.map((item, i) => (
          <div
            key={`${item.url}-${i}`}
            className="relative flex h-full w-full flex-none snap-center items-center justify-center"
          >
            {item.type === "video" ? (
              <video
                src={item.url}
                poster={item.poster}
                controls={videoControls}
                muted
                loop
                playsInline
                preload="metadata"
                className={`max-h-full max-w-full ${mediaClassName}`}
                onClick={(e) => {
                  if (videoControls) return;
                  e.preventDefault();
                  e.stopPropagation();
                  const v = e.currentTarget;
                  if (v.paused) void v.play();
                  else v.pause();
                }}
              />
            ) : (
              <img
                src={item.url}
                alt={items.length > 1 ? `${alt} — ${i + 1}` : alt}
                loading={i === 0 ? imageLoading : "lazy"}
                decoding="async"
                className={`max-h-full max-w-full ${mediaClassName}`}
              />
            )}

            {item.type === "video" && !videoControls && (
              <span className="pointer-events-none absolute bottom-3 left-3 z-20 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                <Play className="h-3 w-3 fill-current" />
                Vídeo
              </span>
            )}
          </div>
        ))}
      </div>

      {!single && (
        <>
          {/* Setas (desktop) */}
          <button
            type="button"
            aria-label="Mídia anterior"
            onClick={(e) => {
              // O carrossel pode estar dentro de um link do card.
              e.preventDefault();
              e.stopPropagation();
              goTo(index - 1);
            }}
            disabled={index === 0}
            className="absolute left-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/85 p-1.5 text-on-surface shadow-md transition hover:bg-white disabled:opacity-0 md:group-hover:block"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Próxima mídia"
            onClick={(e) => {
              // O carrossel pode estar dentro de um link do card.
              e.preventDefault();
              e.stopPropagation();
              goTo(index + 1);
            }}
            disabled={index === items.length - 1}
            className="absolute right-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/85 p-1.5 text-on-surface shadow-md transition hover:bg-white disabled:opacity-0 md:group-hover:block"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Pontinhos */}
          <div className="pointer-events-none absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
            {items.map((item, i) => (
              <span
                key={`dot-${item.url}-${i}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-4 bg-primary" : "w-1.5 bg-on-surface/25"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
