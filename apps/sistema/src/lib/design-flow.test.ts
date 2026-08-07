import { describe, it, expect } from "vitest";
import { DesignStatus, BudgetStatus, SaleStatus } from "@cleci/db";
import {
  podeSolicitar,
  podeCancelar,
  podeAssumir,
  podeAnexarArte,
  podeEntregar,
  podePedirRevisao,
  podeAprovarArte,
  podeVerDesign,
  aindaAberto,
  resumoParaVendedor,
  type DesignSubject,
} from "./design-flow";

const vendedor = { id: "u-vend", role: "VENDEDOR_FIXO" as const };
const outroVendedor = { id: "u-outro", role: "VENDEDOR_FIXO" as const };
const designer = { id: "u-design", role: "DESIGN" as const };
const gerente = { id: "u-ger", role: "GERENTE" as const };
const afiliado = { id: "u-afi", role: "AFILIADO" as const };

function orcamento(patch: Partial<DesignSubject> = {}): DesignSubject {
  return {
    vendedorId: vendedor.id,
    designStatus: null,
    designerId: null,
    saleStatus: null,
    budgetStatus: BudgetStatus.RASCUNHO,
    artCount: 0,
    ...patch,
  };
}

describe("o fluxo é opcional", () => {
  it("orçamento sem arte não tem estado de design", () => {
    const s = orcamento();
    expect(s.designStatus).toBeNull();
    expect(resumoParaVendedor(s)).toBeNull();
  });

  it("nada no fluxo bloqueia a venda: dá para aceitar com a arte em produção", () => {
    // A regra de aceite vive em budgets.ts e não consulta designStatus. Este
    // teste trava a intenção: o design não é etapa obrigatória da venda.
    const s = orcamento({ designStatus: DesignStatus.EM_PRODUCAO });
    expect(aindaAberto(s)).toBe(true);
  });
});

describe("podeSolicitar", () => {
  it("o vendedor dono manda para o design", () => {
    expect(podeSolicitar(vendedor, orcamento())).toBe(true);
  });

  it("vale em rascunho, pendente e aceito — em qualquer momento antes do fim", () => {
    for (const budgetStatus of [BudgetStatus.RASCUNHO, BudgetStatus.ENVIADO, BudgetStatus.ACEITO]) {
      expect(podeSolicitar(vendedor, orcamento({ budgetStatus }))).toBe(true);
    }
  });

  it("não vale depois da venda finalizada", () => {
    expect(
      podeSolicitar(
        vendedor,
        orcamento({ budgetStatus: BudgetStatus.ACEITO, saleStatus: SaleStatus.PAGO }),
      ),
    ).toBe(false);
  });

  it("outro vendedor não mexe no orçamento alheio", () => {
    expect(podeSolicitar(outroVendedor, orcamento())).toBe(false);
  });

  it("gerente pode, acompanhando a equipe", () => {
    expect(podeSolicitar(gerente, orcamento())).toBe(true);
  });

  it("não pede duas vezes: já no fluxo, o caminho é pedir revisão", () => {
    expect(podeSolicitar(vendedor, orcamento({ designStatus: DesignStatus.SOLICITADO }))).toBe(
      false,
    );
    expect(podeSolicitar(vendedor, orcamento({ designStatus: DesignStatus.APROVADA }))).toBe(false);
  });
});

describe("podeCancelar", () => {
  it("dá para desistir enquanto ninguém pegou", () => {
    expect(podeCancelar(vendedor, orcamento({ designStatus: DesignStatus.SOLICITADO }))).toBe(true);
  });

  it("não cancela depois que o design assumiu", () => {
    expect(podeCancelar(vendedor, orcamento({ designStatus: DesignStatus.EM_PRODUCAO }))).toBe(
      false,
    );
  });
});

describe("podeAssumir", () => {
  it("designer assume o que está na fila", () => {
    expect(podeAssumir(designer, orcamento({ designStatus: DesignStatus.SOLICITADO }))).toBe(true);
    expect(podeAssumir(designer, orcamento({ designStatus: DesignStatus.REVISAO }))).toBe(true);
  });

  it("não assume o que já foi entregue", () => {
    expect(podeAssumir(designer, orcamento({ designStatus: DesignStatus.ENTREGUE }))).toBe(false);
  });

  it("vendedor e afiliado não assumem trabalho de design", () => {
    const s = orcamento({ designStatus: DesignStatus.SOLICITADO });
    expect(podeAssumir(vendedor, s)).toBe(false);
    expect(podeAssumir(afiliado, s)).toBe(false);
  });
});

describe("podeEntregar", () => {
  it("exige pelo menos uma arte anexada", () => {
    const semArte = orcamento({ designStatus: DesignStatus.EM_PRODUCAO, artCount: 0 });
    expect(podeAnexarArte(designer, semArte)).toBe(true);
    expect(podeEntregar(designer, semArte)).toBe(false);
  });

  it("com arte anexada, entrega", () => {
    expect(
      podeEntregar(designer, orcamento({ designStatus: DesignStatus.EM_PRODUCAO, artCount: 1 })),
    ).toBe(true);
  });

  it("vendedor não entrega arte no lugar do design", () => {
    expect(
      podeEntregar(vendedor, orcamento({ designStatus: DesignStatus.EM_PRODUCAO, artCount: 1 })),
    ).toBe(false);
  });
});

describe("podePedirRevisao e podeAprovarArte", () => {
  const entregue = orcamento({ designStatus: DesignStatus.ENTREGUE, artCount: 1 });

  it("depois de entregue, o vendedor aprova ou pede ajuste", () => {
    expect(podeAprovarArte(vendedor, entregue)).toBe(true);
    expect(podePedirRevisao(vendedor, entregue)).toBe(true);
  });

  it("arte aprovada ainda pode voltar para revisão", () => {
    // O cliente muda de ideia antes de fechar; não faz sentido travar.
    const aprovada = orcamento({ designStatus: DesignStatus.APROVADA, artCount: 1 });
    expect(podePedirRevisao(vendedor, aprovada)).toBe(true);
    expect(podeAprovarArte(vendedor, aprovada)).toBe(false);
  });

  it("depois da venda finalizada não se mexe mais na arte", () => {
    const fechado = orcamento({
      designStatus: DesignStatus.APROVADA,
      saleStatus: SaleStatus.PAGO,
      artCount: 1,
    });
    expect(podePedirRevisao(vendedor, fechado)).toBe(false);
  });

  it("o designer não aprova a própria arte", () => {
    expect(podeAprovarArte(designer, entregue)).toBe(false);
  });
});

describe("podeVerDesign", () => {
  it("o designer só vê orçamento que entrou no fluxo", () => {
    expect(podeVerDesign(designer, orcamento())).toBe(false);
    expect(podeVerDesign(designer, orcamento({ designStatus: DesignStatus.SOLICITADO }))).toBe(true);
  });

  it("o dono e a equipe administrativa veem sempre", () => {
    expect(podeVerDesign(vendedor, orcamento())).toBe(true);
    expect(podeVerDesign(gerente, orcamento())).toBe(true);
  });

  it("vendedor de fora não vê, nem com arte no fluxo", () => {
    expect(
      podeVerDesign(outroVendedor, orcamento({ designStatus: DesignStatus.ENTREGUE })),
    ).toBe(false);
  });
});
