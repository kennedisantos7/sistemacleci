import {
  BadgeDollarSign,
  Building2,
  CircleHelp,
  ClipboardList,
  FilePlus2,
  GitBranch,
  LayoutDashboard,
  Link2,
  Package,
  UserRound,
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

export type DadosVendedor = {
  /** Dias sem atividade até a empresa ficar disponível para outro vendedor. */
  diasCarteira: number;
  cookieDias: number;
};

const TOPICOS: Topico[] = [
  { id: "painel", titulo: "Seu painel" },
  { id: "clientes", titulo: "Clientes e carteira" },
  { id: "orcamento-criar", titulo: "Criando um orçamento" },
  { id: "orcamento-status", titulo: "Do envio ao fechamento" },
  { id: "pedidos", titulo: "Pedidos" },
  { id: "produtos", titulo: "Tabela de produtos" },
  { id: "links", titulo: "Seus links de divulgação" },
  { id: "comissao", titulo: "Sua comissão" },
  { id: "conta", titulo: "Sua conta" },
  { id: "duvidas", titulo: "Dúvidas frequentes" },
];

export function ManualVendedor({ dados }: { dados: DadosVendedor }) {
  const dias = dados.diasCarteira;

  return (
    <div className="space-y-6">
      <Indice topicos={TOPICOS} />

      <Secao id="painel" titulo="Seu painel" icone={LayoutDashboard}>
        <p>
          O <Tela>Dashboard</Tela> resume o seu trabalho. No topo, escolha o período que quer ver:{" "}
          <Tela>Hoje</Tela>, <Tela>7 dias</Tela>, <Tela>30 dias</Tela>, <Tela>Este mês</Tela> ou{" "}
          <Tela>Personalizado</Tela>.
        </p>
        <Glossario
          itens={[
            ["Vendas no período", "Soma das vendas que você finalizou no período."],
            ["Comissão a receber", "Sua comissão sobre essas vendas (veja “Sua comissão”)."],
            ["Ticket médio", "Valor médio de cada venda fechada."],
            ["Taxa de conversão", "Quantos orçamentos respondidos o cliente aceitou."],
            ["Aguardando resposta", "Orçamentos enviados que o cliente ainda não respondeu."],
            ["Vendas pendentes", "Orçamentos aceitos que você ainda não marcou como finalizados."],
            ["Meta do mês", "Sempre o mês atual, independente do período escolhido."],
          ]}
        />
        <Dica>
          se aparecer um aviso amarelo sobre a sua carteira, há empresas prestes a ficar livres
          para outros vendedores. Registre um contato com elas para manter a prioridade.
        </Dica>
      </Secao>

      <Secao id="clientes" titulo="Clientes e carteira" icone={Building2}>
        <p>
          A base de empresas é <strong>compartilhada por toda a equipe</strong>, mas quem cadastra
          tem prioridade: enquanto você estiver trabalhando a empresa, ela é sua e nenhum outro
          vendedor pode atendê-la.
        </p>
        <Importante>
          a prioridade dura <strong>{dias} dias</strong> e se renova a cada atividade — um contato
          registrado, um orçamento, uma edição na ficha. Sem nenhuma atividade por {dias} dias, a
          empresa fica <strong>Disponível</strong> e outro vendedor pode assumi-la.
        </Importante>
        <p className="font-medium text-foreground">Cadastrar uma empresa</p>
        <Passos>
          <li>
            Em <Tela>Clientes</Tela>, <strong>busque primeiro</strong> pelo nome, empresa ou
            CPF/CNPJ — a busca cobre a base inteira e evita cadastro duplicado.
          </li>
          <li>
            Não achou? Clique em <Tela>Nova empresa</Tela> e preencha a ficha. Ela já nasce na sua
            carteira.
          </li>
        </Passos>
        <p className="font-medium text-foreground">O que cada selo quer dizer</p>
        <Glossario
          itens={[
            ["Sua", "Está na sua carteira."],
            [
              "Em atendimento",
              "É de outro vendedor, que está ativo. O contato fica escondido até ela ficar disponível.",
            ],
            ["Disponível", `O vendedor anterior ficou mais de ${dias} dias sem atividade. Você pode assumir.`],
            ["Sem vendedor", "Ninguém está atendendo. Você pode assumir."],
          ]}
        />
        <p className="font-medium text-foreground">Registrar um contato</p>
        <p>
          Na ficha da empresa, escolha o <Tela>Tipo</Tela> (Ligação, WhatsApp, E-mail, Reunião,
          Visita, Proposta enviada ou Observação), conte em <Tela>O que aconteceu</Tela> e clique em{" "}
          <Tela>Registrar atividade</Tela>. Em empresa disponível, o botão vira{" "}
          <Tela>Assumir e registrar</Tela> — registrar já passa a empresa para você.
        </p>
        <Dica>
          use o filtro <Tela>Minhas empresas</Tela> para ver só a sua carteira e{" "}
          <Tela>Disponíveis</Tela> para achar empresas que você pode assumir.
        </Dica>
      </Secao>

      <Secao id="orcamento-criar" titulo="Criando um orçamento" icone={FilePlus2}>
        <Passos>
          <li>
            Em <Tela>Orçamentos</Tela>, clique em <Tela>Novo orçamento</Tela>.
          </li>
          <li>
            Escolha o <Tela>Cliente</Tela>. Só aparecem empresas da <strong>sua carteira</strong>{" "}
            — empresa de outro vendedor precisa ser assumida antes.
          </li>
          <li>
            Preencha <Tela>Forma de pagamento</Tela>, <Tela>Prazo de entrega</Tela>,{" "}
            <Tela>Cidade de entrega</Tela> e <Tela>Válido até</Tela>. O <Tela>Título</Tela> é
            opcional e ajuda a achar o orçamento depois (ex.: “Fachada Loja Centro”).
          </li>
          <li>
            Clique em <Tela>Adicionar item</Tela> e, no campo <Tela>Produto</Tela>, digite o código
            ou o nome. O valor da tabela entra sozinho.
          </li>
          <li>
            Confira a <Tela>Unidade</Tela> e a <Tela>Qtd</Tela>. Em itens por <strong>M²</strong>,
            informe <Tela>Largura (m)</Tela> e <Tela>Compr. (m)</Tela>: a área e o valor são
            calculados na hora.
          </li>
          <li>
            Se precisar, lance <Tela>Desconto</Tela>, <Tela>Adicional</Tela>, <Tela>Frete</Tela> ou{" "}
            <Tela>Imposto</Tela> — em reais ou em percentual sobre o total.
          </li>
          <li>
            Clique em <Tela>Criar orçamento</Tela>. Ele nasce como <strong>Rascunho</strong>.
          </li>
        </Passos>
        <Dica>
          produto que aparece como <strong>“a definir”</strong> não tem preço fixo na tabela:
          digite o valor combinado no próprio orçamento. O que você escrever em{" "}
          <Tela>Observações</Tela> sai no PDF para o cliente.
        </Dica>
      </Secao>

      <Secao id="orcamento-status" titulo="Do envio ao fechamento" icone={GitBranch}>
        <p>
          Todo orçamento segue o mesmo caminho. Os botões de cada etapa aparecem na tela do
          orçamento, em destaque:
        </p>
        <Glossario
          itens={[
            [
              "Rascunho",
              <>
                Ainda em montagem. Dá para <Tela>Editar</Tela> e <Tela>Baixar PDF</Tela>. Quando
                mandar para o cliente, clique em <Tela>Marcar como enviado</Tela>.
              </>,
            ],
            [
              "Pendente",
              <>
                Enviado, esperando a resposta. Registre <Tela>Cliente aceitou</Tela> ou{" "}
                <Tela>Cliente recusou</Tela>.
              </>,
            ],
            [
              "Aceito",
              <>
                O aceite cria a venda. Quando o cliente pagar e receber, clique em{" "}
                <Tela>Marcar venda como finalizada</Tela> — só então ela entra nas suas vendas e na
                sua comissão.
              </>,
            ],
            [
              "Recusado",
              <>
                Se o cliente voltar atrás, ainda dá para registrar <Tela>Cliente aceitou</Tela>.
              </>,
            ],
          ]}
        />
        <Importante>
          depois de <strong>enviado</strong>, o orçamento não pode mais ser editado. Para corrigir,
          use <Tela>Voltar para rascunho</Tela>, edite e envie de novo.
        </Importante>
        <p>
          Se você criar um orçamento e tentar sair da tela sem enviar, o sistema pergunta se quer
          sair mesmo assim — para nenhum orçamento ficar esquecido como rascunho. Passada a data de{" "}
          <Tela>Válido até</Tela>, o orçamento ganha o selo <strong>Vencido</strong>.
        </p>
        <Dica>
          na lista de <Tela>Orçamentos</Tela>, filtre pela etapa (Rascunhos, Pendentes, Aceitos,
          Recusados) ou use a busca por cliente, empresa ou título.
        </Dica>
      </Secao>

      <Secao id="pedidos" titulo="Pedidos" icone={ClipboardList}>
        <p>
          Orçamento e pedido são documentos diferentes. O <strong>orçamento</strong> é a proposta:
          o PDF é enxuto, focado no valor. O <strong>pedido</strong> fecha a venda: o PDF sai
          completo, com os dados da empresa, as cláusulas e as duas assinaturas.
        </p>
        <Passos>
          <li>
            Na tela do orçamento, clique em <Tela>Converter em pedido</Tela>.
          </li>
          <li>
            Ele sai de <Tela>Orçamentos</Tela> e passa para <Tela>Pedidos</Tela>, com o mesmo
            número e os mesmos itens.
          </li>
          <li>
            Baixe o PDF do pedido e envie ao cliente para assinar.
          </li>
        </Passos>
        <Importante>
          a conversão é de <strong>mão única</strong>: um pedido não volta a ser orçamento.
        </Importante>
        <p>
          Se o cliente já chegou decidido, dá para criar direto em <Tela>Pedidos</Tela> →{" "}
          <Tela>Novo pedido</Tela>. O caminho de etapas é o mesmo do orçamento.
        </p>
      </Secao>

      <Secao id="produtos" titulo="Tabela de produtos" icone={Package}>
        <p>
          Em <Tela>Produtos</Tela> você consulta a tabela inteira, em ordem alfabética: código,
          descrição, foto, categoria e o valor de cada unidade de venda. Use a busca por código ou
          descrição e o filtro de categoria.
        </p>
        <p>
          A tabela é <strong>só para consulta</strong>. Preços e cadastro de produtos são alterados
          pelo administrador.
        </p>
      </Secao>

      <Secao id="links" titulo="Seus links de divulgação" icone={Link2}>
        <p>
          Em <Tela>Meus Links</Tela> você tem um link pessoal do site da Cleci. Quem entra por ele
          fica marcado como seu cliente por {dados.cookieDias} dias, e as vendas que vierem por ali
          contam para você.
        </p>
        <Passos>
          <li>
            Clique em <Tela>Ativar modo afiliado no site</Tela>, no mesmo navegador em que está
            logado no painel.
          </li>
          <li>
            Em qualquer produto do site, use <Tela>Copiar link (WhatsApp)</Tela> e envie ao cliente.
          </li>
          <li>
            Para medir uma campanha, use <Tela>Gerar novo link</Tela>: cada link mostra seus
            cliques e vendas.
          </li>
        </Passos>
        <Dica>
          quando o cliente chama pelo WhatsApp a partir do seu link, a mensagem já sai com o seu
          código no final, <code>(ref: ...)</code>. Peça para ele não apagar esse trecho.
        </Dica>
      </Secao>

      <Secao id="comissao" titulo="Sua comissão" icone={BadgeDollarSign}>
        <p>
          A comissão é um percentual sobre as vendas <strong>finalizadas</strong>. O percentual é
          definido pelo administrador — pode ser o padrão da equipe ou um percentual só seu.
        </p>
        <Importante>
          a comissão de vendedor é <strong>paga fora da plataforma</strong>. O valor em{" "}
          <Tela>Comissão a receber</Tela> é para você acompanhar; não há saque pelo sistema.
        </Importante>
        <p>
          O painel também mostra quanto de comissão existe nos orçamentos ainda aguardando
          resposta — é o que você ganha se eles forem aceitos.
        </p>
      </Secao>

      <Secao id="conta" titulo="Sua conta" icone={UserRound}>
        <p>
          Para trocar a senha, clique em <Tela>Minha conta</Tela>, no topo do painel. Você vai
          precisar da senha atual.
        </p>
      </Secao>

      <Secao id="duvidas" titulo="Dúvidas frequentes" icone={CircleHelp}>
        <div className="space-y-2">
          <Pergunta pergunta="A empresa não aparece na lista de clientes do orçamento.">
            <p>
              No orçamento só aparecem empresas da sua carteira. Busque a empresa em{" "}
              <Tela>Clientes</Tela>: se estiver <strong>Disponível</strong> ou{" "}
              <strong>Sem vendedor</strong>, assuma; se não existir, cadastre em{" "}
              <Tela>Nova empresa</Tela>.
            </p>
          </Pergunta>
          <Pergunta pergunta="A empresa está “Em atendimento” e não vejo o telefone.">
            <p>
              Ela está na carteira de outro vendedor, que está ativo. O contato fica escondido até
              ela ficar disponível. Se o cliente procurou você diretamente, fale com o gerente — ele
              pode transferir a empresa.
            </p>
          </Pergunta>
          <Pergunta pergunta="Enviei o orçamento com um erro.">
            <p>
              Na tela do orçamento, clique em <Tela>Voltar para rascunho</Tela>, corrija em{" "}
              <Tela>Editar</Tela> e marque como enviado de novo.
            </p>
          </Pergunta>
          <Pergunta pergunta="Converti em pedido por engano.">
            <p>
              A conversão não pode ser desfeita pelo sistema. Fale com o administrador.
            </p>
          </Pergunta>
          <Pergunta pergunta="Como apago um rascunho que não vou usar?">
            <p>
              A exclusão de rascunhos é feita pelo administrador ou pelo gerente. Peça a eles.
            </p>
          </Pergunta>
          <Pergunta pergunta="Minha comissão aparece como “—”.">
            <p>
              O percentual da sua comissão ainda não foi definido. Fale com o administrador.
            </p>
          </Pergunta>
          <Pergunta pergunta="O preço de um produto está errado.">
            <p>
              Avise o administrador — só ele altera a tabela. No orçamento, você pode ajustar o
              valor do item para aquele cliente.
            </p>
          </Pergunta>
        </div>
      </Secao>
    </div>
  );
}
