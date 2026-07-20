import { requireUser } from "@/server/session";
import { getConfig } from "@/server/services/config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { bpsToPercent } from "@/lib/money";
import { ConfigForm } from "./config-form";

export const dynamic = "force-dynamic";

export default async function AdminComissoesPage() {
  // Taxas são fixas: apenas o DESENVOLVEDOR pode alterá-las.
  await requireUser(["DESENVOLVEDOR"]);

  const config = await getConfig();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Comissões</h1>
        <p className="text-muted-foreground">
          Taxas fixas do programa. Apenas o desenvolvedor pode alterá-las.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Taxas do programa</CardTitle>
          <CardDescription>
            Aplicadas no momento da venda e congeladas na comissão (snapshot) — alterações
            valem apenas para vendas futuras.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConfigForm
            afiliadoVendaPercent={(config.afiliadoVendaBps / 100).toString()}
            afiliadoIndicacaoPercent={(config.afiliadoIndicacaoBps / 100).toString()}
            desenvolvedorPercent={(config.desenvolvedorBps / 100).toString()}
            cookieDays={config.cookieDurationDays}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Como é calculado</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Venda pelo link de pagamento</strong> (gateway):
              afiliado recebe {bpsToPercent(config.afiliadoVendaBps)} e o desenvolvedor{" "}
              {bpsToPercent(config.desenvolvedorBps)}.
            </li>
            <li>
              <strong className="text-foreground">Indicação pelo link de WhatsApp</strong> (lead):
              afiliado recebe {bpsToPercent(config.afiliadoIndicacaoBps)} e o desenvolvedor{" "}
              {bpsToPercent(config.desenvolvedorBps)}.
            </li>
            <li>
              A participação do desenvolvedor só incide sobre vendas atribuídas a um afiliado.
            </li>
            <li>
              <strong className="text-foreground">Vendedores fixos</strong> não geram comissão na
              plataforma — o acerto é feito fora do sistema.
            </li>
            <li>
              O saldo acumula no painel; afiliado e desenvolvedor solicitam o saque em{" "}
              <strong className="text-foreground">Meus saques</strong> e o admin paga manualmente
              via Pix.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
