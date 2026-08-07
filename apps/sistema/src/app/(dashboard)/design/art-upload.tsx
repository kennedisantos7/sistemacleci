"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_BYTES = 4 * 1024 * 1024;

/** Lê largura/altura no navegador para avisar quando a arte não é quadrada. */
function medir(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

export function ArtUpload({ budgetId }: { budgetId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function enviar(file: File) {
    setErro(null);
    setAviso(null);

    if (file.size > MAX_BYTES) {
      setErro("Arquivo muito grande (máx. 4 MB).");
      return;
    }

    const medidas = await medir(file);
    // Avisa, mas não bloqueia: recusar por alguns pixels travaria o trabalho.
    // No PDF a arte entra numa moldura quadrada, inteira, sem corte.
    if (medidas && medidas.width !== medidas.height) {
      setAviso(
        `A arte tem ${medidas.width}×${medidas.height}px e não é quadrada. Ela entra inteira no PDF, com margem sobrando.`,
      );
    }

    const form = new FormData();
    form.append("file", file);
    if (medidas) {
      form.append("width", String(medidas.width));
      form.append("height", String(medidas.height));
    }

    setEnviando(true);
    try {
      const res = await fetch(`/api/design/${budgetId}/arte`, { method: "POST", body: form });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErro(json.error ?? "Falha ao enviar a arte.");
        return;
      }
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch {
      setErro("Não consegui enviar. Confira a conexão e tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void enviar(file);
        }}
      />
      <Button
        type="button"
        size="sm"
        disabled={enviando}
        onClick={() => inputRef.current?.click()}
      >
        <UploadCloud className="h-4 w-4" />
        {enviando ? "Enviando..." : "Anexar arte"}
      </Button>
      <p className="text-xs text-muted-foreground">
        PNG, JPG ou WEBP, até 4 MB. O ideal é quadrada (ex.: 1080×1080).
      </p>
      {aviso ? <p className="text-xs text-amber-700">{aviso}</p> : null}
      {erro ? <p className="text-sm text-red-600">{erro}</p> : null}
    </div>
  );
}
