"use client";

import { useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function normalizeUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  try {
    const u = new URL(v);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/uploads", { method: "POST", body: fd });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? "Falha no upload.");
  return data.url;
}

/** Upload da imagem principal (uma URL, guardada em hidden input `imageUrl`). */
export function MainImageUpload({ defaultUrl }: { defaultUrl?: string }) {
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function applyLink() {
    const normalized = normalizeUrl(link);
    if (!normalized) {
      setError("Link inválido. Cole uma URL http(s) completa.");
      return;
    }
    setError(null);
    setUrl(normalized);
    setLink("");
  }

  async function onPick(file: File) {
    setBusy(true);
    setError(null);
    try {
      setUrl(await uploadFile(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no upload.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name="imageUrl" value={url} />
      <div className="flex items-center gap-3">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Prévia" className="h-20 w-20 rounded-md border border-border object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
            <ImagePlus className="h-6 w-6" />
          </div>
        )}
        <div className="space-y-1">
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {busy ? "Enviando..." : url ? "Trocar imagem" : "Enviar imagem"}
          </Button>
          {url ? (
            <button
              type="button"
              onClick={() => setUrl("")}
              className="block text-xs text-muted-foreground hover:text-foreground"
            >
              Remover
            </button>
          ) : null}
        </div>
      </div>
      <div className="flex gap-2">
        <Input
          value={link}
          placeholder="ou cole um link (https://...)"
          onChange={(e) => setLink(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              applyLink();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={applyLink} disabled={!link.trim()}>
          <Link2 className="h-4 w-4" />
          Usar link
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onPick(f);
          e.target.value = "";
        }}
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

/** Upload de galeria (várias URLs, guardadas em hidden input `gallery` JSON). */
export function GalleryUpload({ defaultUrls }: { defaultUrls?: string[] }) {
  const [urls, setUrls] = useState<string[]>(defaultUrls ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function applyLink() {
    const normalized = normalizeUrl(link);
    if (!normalized) {
      setError("Link inválido. Cole uma URL http(s) completa.");
      return;
    }
    setError(null);
    setUrls((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
    setLink("");
  }

  async function onPick(files: FileList) {
    setBusy(true);
    setError(null);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) uploaded.push(await uploadFile(file));
      setUrls((prev) => [...prev, ...uploaded]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no upload.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name="gallery" value={JSON.stringify(urls)} />
      {urls.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {urls.map((u) => (
            <div key={u} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="h-16 w-16 rounded-md border border-border object-cover" />
              <button
                type="button"
                onClick={() => setUrls((prev) => prev.filter((x) => x !== u))}
                className="absolute -right-1.5 -top-1.5 rounded-full bg-red-600 p-0.5 text-white"
                aria-label="Remover imagem"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        {busy ? "Enviando..." : "Adicionar à galeria"}
      </Button>
      <div className="flex gap-2">
        <Input
          value={link}
          placeholder="ou cole um link (https://...)"
          onChange={(e) => setLink(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              applyLink();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={applyLink} disabled={!link.trim()}>
          <Link2 className="h-4 w-4" />
          Adicionar link
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void onPick(e.target.files);
          e.target.value = "";
        }}
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
