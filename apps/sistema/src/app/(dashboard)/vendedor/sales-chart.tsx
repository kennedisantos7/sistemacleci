import { formatCents } from "@/lib/money";

/**
 * Barras de vendas por dia. CSS puro, sem biblioteca de gráfico: são poucos
 * pontos e o painel já renderiza no servidor — não vale carregar JS por isso.
 */
export function SalesChart({ dados }: { dados: Array<{ dia: string; totalCents: number }> }) {
  const maximo = Math.max(...dados.map((d) => d.totalCents), 1);
  const total = dados.reduce((s, d) => s + d.totalCents, 0);

  if (total === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhuma venda finalizada neste período.
      </p>
    );
  }

  // Muitos dias: rotula só as pontas, senão as datas viram borrão.
  const mostrarTodosRotulos = dados.length <= 14;

  return (
    <div className="space-y-2">
      <div className="flex h-40 items-end gap-1 overflow-x-auto">
        {dados.map((d) => {
          const altura = Math.round((d.totalCents / maximo) * 100);
          const [, mes, dia] = d.dia.split("-");
          return (
            <div key={d.dia} className="flex min-w-[14px] flex-1 flex-col items-center gap-1">
              <div className="flex h-32 w-full items-end">
                <div
                  className={`w-full rounded-t ${d.totalCents > 0 ? "bg-primary" : "bg-muted"}`}
                  style={{ height: `${Math.max(altura, d.totalCents > 0 ? 4 : 2)}%` }}
                  title={`${dia}/${mes}: ${formatCents(d.totalCents)}`}
                />
              </div>
              {mostrarTodosRotulos ? (
                <span className="text-[10px] text-muted-foreground">{dia}/{mes}</span>
              ) : null}
            </div>
          );
        })}
      </div>

      {!mostrarTodosRotulos ? (
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>{dados[0]?.dia.split("-").reverse().join("/")}</span>
          <span>{dados.at(-1)?.dia.split("-").reverse().join("/")}</span>
        </div>
      ) : null}
    </div>
  );
}
