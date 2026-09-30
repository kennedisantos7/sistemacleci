import {
  BadgeDollarSign,
  CircleHelp,
  Compass,
  Link2,
  MousePointerClick,
  Route,
  UserRound,
  Wallet,
  Rocket,
} from "lucide-react";
import {
  Dica,
  Glossario,
  Importante,
  Indice,
  Passos,
  Pergunta,
  Secao,
  Tela,
  type Topico,
} from "./manual-ui";

export type TaxasAfiliado = {
  /** Venda paga pelo link de pagamento (checkout online), ex.: "8%". */
  venda: string;
  /** Indicação fechada pelo WhatsApp, ex.: "3%". */
  indicacao: string;
  cookieDias: number;
  /** Pagamento online configurado — sem ele não há "link de pagamento". */
  checkoutOnline: boolean;
};

const TOPICOS: Topico[] = [
  { id: "como-funciona", titulo: "Como o programa funciona" },
  { id: "primeiro-acesso", titulo: "Primeiro acesso" },
  { id: "modo-afiliado", titulo: "Modo afiliado: link de qualquer produto" },
  { id: "links", titulo: "Links de campanha" },
  { id: "atribuicao", titulo: "Como a venda chega até você" },
  { id: "comissoes", titulo: "Comissões e saldo" },
  { id: "saques", titulo: "Como sacar" },
  { id: "conta", titulo: "Sua conta" },
  { id: "duvidas", titulo: "Dúvidas frequentes" },
];

export function ManualAfiliado({ taxas }: { taxas: TaxasAfiliado }) {
  return (
    <div className="space-y-6">
      <Indice topicos={TOPICOS} />

      <Secao id="como-funciona" titulo="Como o programa funciona" icone={Compass}>
        <p>
          Você divulga os produtos da Cleci com o <strong>seu link</strong>. Quem clica fica marcado
          como seu cliente por <strong>{taxas.cookieDias} dias</strong>. Se essa pessoa comprar
          nesse período, a venda é sua e você recebe comissão.
        </p>
        <Glossario
          itens={[
            [
              "Indicação pelo WhatsApp",
              <>
                O cliente fala com a Cleci pelo WhatsApp e fecha o pedido com a equipe. Comissão de{" "}
                <strong className="text-foreground">{taxas.indicacao}</strong> sobre o valor da venda.
              </>,
            ],
            taxas.checkoutOnline
              ? [
                  "Venda pelo link de pagamento",
                  <>
                    O cliente paga direto no site, pelo Mercado Pago. Comissão de{" "}
                    <strong className="text-foreground">{taxas.venda}</strong> sobre o valor da venda.
                  </>,
                ]
              : [
                  "Venda pelo link de pagamento",
                  <>
                    Ainda não disponível — por enquanto, todas as vendas são fechadas pelo
                    WhatsApp. Quando o pagamento online for ativado, a comissão desse canal será de{" "}
                    <strong className="text-foreground">{taxas.venda}</strong>.
                  </>,
                ],
          ]}
        />
      </Secao>

      <Secao id="primeiro-acesso" titulo="Primeiro acesso" icone={Rocket}>
        <Passos>
          <li>
            Crie sua conta em <Tela>Cadastre-se</Tela>, na tela de login.
          </li>
          <li>
            Aguarde a <strong>aprovação do administrador</strong>. Até lá, o login não entra — é
            normal.
          </li>
          <li>Depois de aprovada, entre com o e-mail e a senha que você cadastrou.</li>
        </Passos>
        <p>
          O menu tem três áreas: <Tela>Dashboard</Tela> (seus ganhos), <Tela>Meus Links</Tela> (o
          que divulgar) e <Tela>Saques</Tela> (como receber).
        </p>
      </Secao>

      <Secao id="modo-afiliado" titulo="Modo afiliado: link de qualquer produto" icone={MousePointerClick}>
        <p>
          É o jeito mais rápido de divulgar: você navega o site normalmente e cada produto ganha um
          botão para copiar o seu link daquele produto.
        </p>
        <Passos>
          <li>
            Em <Tela>Meus Links</Tela>, clique em <Tela>Ativar modo afiliado no site</Tela>.
          </li>
          <li>O site abre numa aba nova. Entre em qualquer produto.</li>
          <li>
            No quadro <Tela>Modo afiliado — copie e envie</Tela>, clique em{" "}
            <Tela>Copiar link (WhatsApp)</Tela>
            {taxas.checkoutOnline ? (
              <>
                {" "}
                ou <Tela>Copiar link (Pagamento)</Tela>
              </>
            ) : null}
            .
          </li>
          <li>Cole o link na conversa, no status ou nas redes sociais.</li>
        </Passos>
        {taxas.checkoutOnline ? (
          <Dica>
            O link de <strong>WhatsApp</strong> leva o cliente ao produto para conversar com a
            equipe. O link de <strong>Pagamento</strong> já abre o botão <Tela>Comprar agora</Tela>{" "}
            — use quando o cliente já decidiu e o produto tem preço fixo.
          </Dica>
        ) : null}
        <Importante>
          use o <strong>mesmo navegador</strong> em que você está logado no painel. O modo
          afiliado é ligado pela sua sessão: num navegador sem login, os botões de copiar não
          aparecem.
        </Importante>
        <p>
          Em <Tela>Meus Links</Tela> também fica o seu <strong>código pessoal</strong> e o link
          principal, que leva à página inicial do site — bom para a bio do Instagram.
        </p>
      </Secao>

      <Secao id="links" titulo="Links de campanha" icone={Link2}>
        <p>
          Quando quiser medir uma divulgação específica (um post, um grupo, uma campanha de fim de
          ano), gere um link curto só para ela. Cada link mostra quantos cliques e quantas vendas
          trouxe.
        </p>
        <Passos>
          <li>
            Em <Tela>Meus Links</Tela>, vá até <Tela>Gerar novo link</Tela>.
          </li>
          <li>
            Em <Tela>Caminho do produto/campanha</Tela>, diga para onde o link leva — por exemplo{" "}
            <code>/tapetes</code>. Deixe vazio para ir à página inicial.
          </li>
          <li>
            Opcional: preencha <Tela>utm_source</Tela> (onde vai divulgar, ex.:{" "}
            <code>instagram</code>) e <Tela>utm_campaign</Tela> (o nome da campanha).
          </li>
          <li>
            Clique em <Tela>Gerar link</Tela> e use o botão de copiar ao lado do link criado.
          </li>
        </Passos>
        <p>
          Link que não serve mais pode ser <Tela>Desativar</Tela>: quem clicar nele cai no site
          sem ser marcado como seu cliente.
        </p>
      </Secao>

      <Secao id="atribuicao" titulo="Como a venda chega até você" icone={Route}>
        <Passos>
          <li>O cliente clica no seu link e o site o marca como seu, por {taxas.cookieDias} dias.</li>
          <li>
            Quando ele chama a Cleci pelo WhatsApp do site, a mensagem já sai com o seu código no
            final, assim: <code>(ref: SEUCODIGO)</code>.
          </li>
          <li>A equipe fecha o pedido e lança a venda com o seu código.</li>
          <li>Com a venda confirmada, a comissão aparece no seu Dashboard.</li>
        </Passos>
        <Importante>
          peça ao cliente para <strong>não apagar</strong> o trecho <code>(ref: ...)</code> da
          mensagem do WhatsApp. É ele que diz à equipe que a venda veio de você.
        </Importante>
        <Glossario
          itens={[
            [
              "Vale o último link",
              "Se o cliente clicar no link de dois afiliados, a venda fica com o último clicado.",
            ],
            [
              "Vale por aparelho",
              "A marcação fica no navegador do cliente. Se ele clicar no celular e comprar pelo computador, a venda não é reconhecida.",
            ],
            [
              "Prazo",
              `${taxas.cookieDias} dias a partir do último clique. Depois disso, é preciso um clique novo.`,
            ],
          ]}
        />
      </Secao>

      <Secao id="comissoes" titulo="Comissões e saldo" icone={BadgeDollarSign}>
        <p>
          O <Tela>Dashboard</Tela> mostra o seu dinheiro em quatro etapas:
        </p>
        <Glossario
          itens={[
            ["Pendente", "Venda confirmada, aguardando a aprovação do administrador."],
            ["Disponível", "Aprovada — pronta para você pedir o saque."],
            ["Em saque", "Você já pediu o saque e ele está sendo processado."],
            ["Recebido", "Já foi paga para você."],
          ]}
        />
        <p>
          A comissão é calculada no momento da venda, com a taxa daquele dia. Se a Cleci mudar as
          taxas depois, as vendas que você já fez não mudam.
        </p>
        <Dica>
          venda devolvida ou estornada pelo cliente tem a comissão cancelada, desde que ainda não
          tenha sido paga.
        </Dica>
      </Secao>

      <Secao id="saques" titulo="Como sacar" icone={Wallet}>
        <Passos>
          <li>
            Em <Tela>Saques</Tela>, preencha a <Tela>Chave Pix</Tela> e o <Tela>CPF/CNPJ</Tela> e
            clique em <Tela>Salvar dados de pagamento</Tela>. Sem a chave Pix, o saque fica
            bloqueado.
          </li>
          <li>
            Quando houver saldo <strong>Disponível</strong>, clique em{" "}
            <Tela>Solicitar saque do saldo disponível</Tela>. O valor disponível inteiro é pedido
            de uma vez.
          </li>
          <li>O administrador aprova e faz o Pix. O andamento aparece no Histórico de saques.</li>
        </Passos>
        <Glossario
          itens={[
            ["Solicitado", "Seu pedido chegou e está na fila."],
            ["Aprovado", "Liberado — o Pix vai ser feito."],
            ["Pago", "O dinheiro foi enviado."],
            [
              "Rejeitado",
              "Não foi pago, e o valor volta para o seu saldo Disponível. Fale com o administrador para saber o motivo.",
            ],
          ]}
        />
      </Secao>

      <Secao id="conta" titulo="Sua conta" icone={UserRound}>
        <p>
          Para trocar a senha, clique em <Tela>Minha conta</Tela>, no topo do painel. Você vai
          precisar da senha atual.
        </p>
      </Secao>

      <Secao id="duvidas" titulo="Dúvidas frequentes" icone={CircleHelp}>
        <div className="space-y-2">
          <Pergunta pergunta="Divulguei e o cliente comprou, mas a comissão não apareceu.">
            <p>A comissão só aparece depois que a equipe confirma a venda. Confira se:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>o cliente clicou no seu link antes de comprar;</li>
              <li>
                a mensagem de WhatsApp dele manteve o <code>(ref: ...)</code>;
              </li>
              <li>ele comprou pelo mesmo aparelho em que clicou, dentro do prazo.</li>
            </ul>
            <p>Se tudo isso aconteceu, fale com o administrador com o nome do cliente.</p>
          </Pergunta>
          <Pergunta pergunta="Posso mandar o link para quem eu quiser?">
            <p>
              Sim — grupos, status, redes sociais, conversa direta. Só evite enviar mensagens em
              massa para quem não pediu: isso pode bloquear o seu número no WhatsApp.
            </p>
          </Pergunta>
          <Pergunta pergunta="Os botões de copiar não aparecem nos produtos.">
            <p>
              Abra o site pelo botão <Tela>Ativar modo afiliado no site</Tela>, no mesmo navegador
              em que você está logado no painel. Se sair do painel, o modo afiliado desliga junto.
            </p>
          </Pergunta>
          <Pergunta pergunta="Qual é o valor mínimo para sacar?">
            <p>
              Não há mínimo: qualquer saldo Disponível pode ser sacado, desde que a chave Pix esteja
              cadastrada.
            </p>
          </Pergunta>
          <Pergunta pergunta="Minha conta foi bloqueada. E os meus links?">
            <p>
              Enquanto a conta estiver bloqueada, os seus links continuam levando ao site, mas não
              marcam mais clientes nem geram comissão.
            </p>
          </Pergunta>
        </div>
      </Secao>
    </div>
  );
}
