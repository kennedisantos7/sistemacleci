import Link from "next/link";
import { PERIODOS, type DateRange } from "@/lib/date-range";
import { Button } from "@/components/ui/button";

/**
 * Filtro de período. Server Component com navegação por link + form GET: o
 * estado mora na URL, então o vendedor consegue guardar/compartilhar a visão.
 */
export function PeriodFilter({ range, basePath }: { range: DateRange; basePath: string }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {PERIODOS.map((p) => {
          const ativo = p.value === range.preset;
          return (
            <Link
              key={p.value}
              href={
                p.value === "custom"
                  ? `${basePath}?periodo=custom&de=${range.deInput}&ate=${range.ateInput}`
                  : `${basePath}?periodo=${p.value}`
              }
              className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                ativo
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {p.label}
            </Link>
          );
        })}
      </div>

      {range.preset === "custom" ? (
        <form method="GET" action={basePath} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="periodo" value="custom" />
          <label className="text-sm">
            <span className="mb-1 block font-medium">De</span>
            <input
              type="date"
              name="de"
              defaultValue={range.deInput}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Até</span>
            <input
              type="date"
              name="ate"
              defaultValue={range.ateInput}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            />
          </label>
          <Button type="submit" variant="outline" size="sm">
            Aplicar
          </Button>
        </form>
      ) : null}

      <p className="text-xs text-muted-foreground">Período: {range.label}</p>
    </div>
  );
}
