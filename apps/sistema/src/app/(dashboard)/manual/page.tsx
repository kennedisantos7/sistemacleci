import Link from "next/link";
import { requireUser } from "@/server/session";
import { getConfig } from "@/server/services/config";
import { isMercadoPagoConfigured } from "@/server/mercadopago";
import { SELLER_ROLES, STAFF_ROLES, isStaff } from "@/lib/rbac";
import { DIAS_ATE_LIBERAR } from "@/lib/client-ownership";
import { bpsToPercent } from "@/lib/money";
import { ManualAfiliado } from "./manual-afiliado";
import { ManualVendedor } from "./manual-vendedor";

export const dynamic = "force-dynamic";

type Publico = "afiliado" | "vendedor";

const ABAS: Array<{ value: Publico; label: string }> = [
  { value: "vendedor", label: "Manual do vendedor" },
  { value: "afiliado", label: "Manual do afiliado" },
];

/**
 * Manual de uso. Cada papel de venda vê o seu; a equipe administrativa vê os
 * dois, para saber o que o time enxerga e orientar quem pergunta.
 *
 * Taxas e prazos vêm da configuração, não do texto: o manual nunca promete um
 * percentual diferente do que o sistema calcula.
 */
export default async function ManualPage({
  searchParams,
}: {
  searchParams: Promise<{ para?: string }>;
}) {
  const user = await requireUser([...STAFF_ROLES, ...SELLER_ROLES]);
  const { para } = await searchParams;
  const equipe = isStaff(user.role);

  const publico: Publico = equipe
    ? para === "afiliado"
      ? "afiliado"
      : "vendedor"
    : user.role === "AFILIADO"
      ? "afiliado"
      : "vendedor";

  const config = await getConfig();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Manual de uso</h1>
        <p className="text-muted-foreground">
          {publico === "afiliado"
            ? "Como divulgar, acompanhar suas comissões e sacar."
            : "Como atender clientes, montar orçamentos e fechar vendas."}
        </p>
      </header>

      {equipe ? (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Escolha o manual">
          {ABAS.map((aba) => {
            const ativa = aba.value === publico;
            return (
              <Link
                key={aba.value}
                href={`/manual?para=${aba.value}`}
                role="tab"
                aria-selected={ativa}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  ativa
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground/70 hover:bg-muted/80"
                }`}
              >
                {aba.label}
              </Link>
            );
          })}
        </div>
      ) : null}

      {publico === "afiliado" ? (
        <ManualAfiliado
          taxas={{
            venda: bpsToPercent(config.afiliadoVendaBps),
            indicacao: bpsToPercent(config.afiliadoIndicacaoBps),
            cookieDias: config.cookieDurationDays,
            checkoutOnline: isMercadoPagoConfigured(),
          }}
        />
      ) : (
        <ManualVendedor
          dados={{ diasCarteira: DIAS_ATE_LIBERAR, cookieDias: config.cookieDurationDays }}
        />
      )}
    </div>
  );
}
