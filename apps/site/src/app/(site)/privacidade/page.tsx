import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade | Cleci Personaliza",
  description:
    "Como a Cleci Personaliza coleta, usa e protege os seus dados pessoais (LGPD).",
};

const ATUALIZACAO = "12 de julho de 2026";

export default function PrivacidadePage() {
  return (
    <div className="max-w-3xl mx-auto px-margin-mobile md:px-gutter py-12">
      <h1 className="font-headline-lg text-3xl md:text-4xl text-on-background mb-2">
        Política de Privacidade
      </h1>
      <p className="text-sm text-on-surface-variant mb-10">
        Última atualização: {ATUALIZACAO}
      </p>

      <div className="space-y-8 font-body-md text-on-surface-variant leading-relaxed [&_h2]:font-headline-sm [&_h2]:text-xl [&_h2]:text-on-background [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1">
        <section>
          <h2>1. Quem somos</h2>
          <p>
            Este site é operado por <strong>CLECI PERSONALIZA LTDA</strong>, CNPJ
            28.402.051/0001-69, com sede na Rua Belmiro da Silva Prado, Qd 20 Lt 02,
            Nova Capital, Porto Nacional – TO, CEP 77501-388 ("Cleci",
            "nós"). Somos os controladores dos dados pessoais tratados neste site e
            no nosso painel de vendedores e afiliados, nos termos da Lei Geral de
            Proteção de Dados (Lei nº 13.709/2018 – LGPD).
          </p>
        </section>

        <section>
          <h2>2. Quais dados coletamos</h2>
          <ul>
            <li>
              <strong>Cadastro de afiliados e vendedores</strong> (painel): nome,
              e-mail e senha (armazenada de forma criptografada). Opcionalmente,
              dados de pagamento para recebimento de comissões (chave Pix, dados
              bancários, CPF/CNPJ).
            </li>
            <li>
              <strong>Pedidos e orçamentos</strong>: quando você fecha um pedido
              pelo WhatsApp ou pelo pagamento online, tratamos nome, contato e os
              dados necessários à venda.
            </li>
            <li>
              <strong>Cookies de atribuição</strong>: quando você acessa o site por
              um link de divulgação, gravamos um cookie próprio (first-party) com o
              código do divulgador, por até 90 dias, para atribuir corretamente a
              eventual venda. Esse cookie não rastreia sua navegação em outros
              sites.
            </li>
          </ul>
        </section>

        <section>
          <h2>3. Para que usamos os dados</h2>
          <ul>
            <li>Processar pedidos, orçamentos e pagamentos;</li>
            <li>Gerenciar contas, comissões e saques de afiliados e vendedores;</li>
            <li>Atribuir vendas ao divulgador correto (programa de afiliados);</li>
            <li>Cumprir obrigações legais, fiscais e de segurança.</li>
          </ul>
        </section>

        <section>
          <h2>4. Com quem compartilhamos</h2>
          <p>
            Não vendemos seus dados. Compartilhamos apenas o necessário com:
            provedores de infraestrutura (hospedagem do site e do banco de dados),
            processadores de pagamento (quando você opta pelo pagamento online) e o
            WhatsApp/Meta (quando você inicia uma conversa de pedido). Cada um
            desses serviços trata os dados conforme suas próprias políticas.
          </p>
        </section>

        <section>
          <h2>5. Por quanto tempo guardamos</h2>
          <p>
            Mantemos os dados enquanto a sua conta estiver ativa ou enquanto forem
            necessários para as finalidades acima e para cumprimento de obrigações
            legais (ex.: registros fiscais de vendas). Depois disso, são excluídos
            ou anonimizados.
          </p>
        </section>

        <section>
          <h2>6. Seus direitos (LGPD)</h2>
          <p>
            Você pode solicitar a qualquer momento: confirmação do tratamento,
            acesso, correção, anonimização, portabilidade ou exclusão dos seus
            dados, além de revogar consentimentos. Para exercer esses direitos,
            fale conosco pelos canais abaixo.
          </p>
        </section>

        <section>
          <h2>7. Segurança</h2>
          <p>
            Adotamos medidas técnicas e organizacionais para proteger os dados:
            conexão criptografada (HTTPS), senhas armazenadas com hash forte,
            controle de acesso por perfil e registro de ações sensíveis.
          </p>
        </section>

        <section>
          <h2>8. Contato</h2>
          <p>
            Dúvidas ou solicitações sobre privacidade: e-mail{" "}
            <a
              href="mailto:clecipersonaliza@gmail.com"
              className="text-primary hover:underline"
            >
              clecipersonaliza@gmail.com
            </a>{" "}
            ou WhatsApp (63) 9 9234-9085.
          </p>
        </section>
      </div>

      <div className="mt-12">
        <Link href="/" className="text-primary font-bold hover:underline">
          ← Voltar para a página inicial
        </Link>
      </div>
    </div>
  );
}
