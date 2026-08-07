import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { formatCents, formatQuantity, formatDecimal } from "@/lib/money";
import { UNIT_LABEL, type BudgetUnit } from "@/lib/budget-math";

// Dados fixos da empresa — cabeçalho impresso da planilha.
const EMPRESA = {
  razao: "Cleci Personaliza Ltda",
  cnpj: "28.402.051/0001-69",
  fone: "(63) 99103-5968 ou (63) 99234-9085",
  email: "clecipersonaliza@gmail.com",
  endereco:
    "Avenida Joaquim Aires, Qd 60 Lote 14, Setor Vila Nova, Porto Nacional - TO · CEP 77500-000",
};

// Cláusulas do rodapé da planilha.
const CLAUSULAS = [
  "Produto possui garantia de 6 meses conforme uso e manutenção.",
  "Sob pena da Lei Complementar nº 116/2003, por ser fabricado por encomenda de sua exclusividade, não aceitamos devolução.",
  "Declaro que li e estou de acordo com as informações contidas no pedido.",
];

// Identidade Cleci
const BLUE = "#1541FC";
const RED = "#FE0000";
const MUTED = "#6b7280";
const BORDER = "#d1d5db";

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 46,
    paddingHorizontal: 28,
    fontSize: 8,
    fontFamily: "Helvetica",
    color: "#1a1c1c",
  },

  // Cabeçalho
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  logo: { width: 78, height: 46, objectFit: "contain" },
  company: { flex: 1, paddingHorizontal: 10 },
  companyName: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  companyLine: { fontSize: 7, color: MUTED, marginTop: 1 },
  headerRight: { alignItems: "flex-end" },
  docTitle: { fontSize: 15, fontFamily: "Helvetica-Bold", color: BLUE },
  docNumber: { fontSize: 8, color: MUTED, marginTop: 2 },
  brandRule: { height: 2.5, backgroundColor: BLUE, marginTop: 6 },
  brandRuleRed: { height: 1.5, backgroundColor: RED, marginBottom: 10 },

  title: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 8 },

  // Blocos de informação
  infoRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  infoBox: { flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 3, padding: 7 },
  infoLabel: {
    fontSize: 7,
    color: BLUE,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  infoLine: { marginBottom: 1.5 },
  infoMuted: { color: MUTED },

  // Tabela de itens — as 10 colunas da planilha
  tableHeader: {
    flexDirection: "row",
    backgroundColor: BLUE,
    color: "#ffffff",
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3.5,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  colCode: { width: 34 },
  colDesc: { flex: 1, paddingRight: 4 },
  colValue: { width: 50, textAlign: "right" },
  colUnit: { width: 38, textAlign: "center" },
  colDim: { width: 30, textAlign: "right" },
  colArea: { width: 34, textAlign: "right" },
  colPartial: { width: 52, textAlign: "right" },
  colQty: { width: 28, textAlign: "right" },
  colTotal: { width: 54, textAlign: "right" },
  dimNote: { fontSize: 6, color: MUTED },

  // Totais
  totalsWrap: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8 },
  totalsBox: { width: 210 },
  totalsLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 1.5,
  },
  totalsFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#1a1c1c",
    marginTop: 3,
    paddingTop: 4,
  },
  totalsFinalLabel: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  totalsFinalValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: BLUE },

  // Observações e cláusulas
  noteBox: { marginTop: 12 },
  noteLabel: {
    fontSize: 7,
    color: BLUE,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  noteText: { color: "#374151", lineHeight: 1.4 },
  clausula: { fontSize: 6.5, color: MUTED, marginTop: 2, lineHeight: 1.3 },

  // Arte: moldura QUADRADA fixa. A imagem entra inteira (objectFit contain),
  // então arte fora do 1:1 sobra margem em vez de ser cortada.
  artBox: { marginTop: 12, alignItems: "center" },
  artFrame: {
    width: 260,
    height: 260,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 3,
    padding: 4,
  },
  artImage: { width: "100%", height: "100%", objectFit: "contain" },
  artCaption: { fontSize: 7, color: MUTED, marginTop: 4, textAlign: "center" },

  // Assinaturas
  signRow: { flexDirection: "row", gap: 40, marginTop: 30 },
  signCol: { flex: 1, alignItems: "center" },
  signLine: { borderTopWidth: 1, borderTopColor: "#1a1c1c", width: "100%", marginBottom: 3 },
  signLabel: { fontSize: 7, fontFamily: "Helvetica-Bold" },
  signName: { fontSize: 7, color: MUTED },

  footer: {
    position: "absolute",
    bottom: 20,
    left: 28,
    right: 28,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 5,
    fontSize: 6.5,
    color: MUTED,
    textAlign: "center",
  },
});

export type OrcamentoPdfData = {
  number: number;
  docType: "ORCAMENTO" | "PEDIDO";
  createdAt: Date;
  validUntil: Date | null;
  title: string | null;
  note: string | null;
  paymentTerms: string | null;
  deliveryForecast: string | null;
  deliveryCity: string | null;
  subtotalCents: number;
  discountCents: number;
  surchargeCents: number;
  freightCents: number;
  taxCents: number;
  totalCents: number;
  client: {
    name: string;
    companyName: string | null;
    document: string | null;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    contactName: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  };
  vendedor: { name: string | null; email: string };
  items: Array<{
    id: string;
    code: string | null;
    description: string;
    unit: BudgetUnit;
    widthM: number | null;
    lengthM: number | null;
    areaM2: number | null;
    quantity: number;
    unitPriceCents: number;
    partialCents: number;
    totalCents: number;
  }>;
  /** Data URI do logo (ou null para omitir). */
  logoSrc: string | null;
  /**
   * Arte do design, quando o orçamento passou por lá. Null quando não passou —
   * o fluxo é opcional e o PDF sai igual ao de antes nesse caso.
   */
  arte: { src: string; aprovada: boolean } | null;
};

function fmtDate(d: Date): string {
  return d.toLocaleDateString("pt-BR");
}

/** Junta partes não vazias — evita " · · " quando o cliente tem campos em branco. */
function joinParts(parts: Array<string | null | undefined>, sep = " · "): string | null {
  const filled = parts.filter((p): p is string => Boolean(p && p.trim()));
  return filled.length ? filled.join(sep) : null;
}

export function OrcamentoDocument({ data }: { data: OrcamentoPdfData }) {
  const isPedido = data.docType === "PEDIDO";
  const docLabel = isPedido ? "PEDIDO" : "ORÇAMENTO";
  const { client } = data;

  const localidade = joinParts([
    joinParts([client.city, client.state], " - "),
    client.zip ? `CEP ${client.zip}` : null,
  ]);
  const contatos = joinParts([client.phone, client.whatsapp ? `WhatsApp ${client.whatsapp}` : null]);

  return (
    <Document title={`${docLabel} #${data.number} — Cleci Personaliza`} author="Cleci Personaliza">
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho da empresa */}
        <View style={styles.header}>
          {data.logoSrc ? (
            <Image src={data.logoSrc} style={styles.logo} />
          ) : (
            <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: BLUE }}>
              Cleci Personaliza
            </Text>
          )}
          <View style={styles.company}>
            <Text style={styles.companyName}>{EMPRESA.razao}</Text>
            <Text style={styles.companyLine}>CNPJ: {EMPRESA.cnpj}</Text>
            <Text style={styles.companyLine}>
              Fone: {EMPRESA.fone} · {EMPRESA.email}
            </Text>
            <Text style={styles.companyLine}>{EMPRESA.endereco}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docTitle}>{docLabel}</Text>
            <Text style={styles.docNumber}>Nº {String(data.number).padStart(4, "0")}</Text>
            <Text style={styles.docNumber}>{fmtDate(data.createdAt)}</Text>
            {data.validUntil ? (
              <Text style={styles.docNumber}>Válido até {fmtDate(data.validUntil)}</Text>
            ) : null}
          </View>
        </View>
        <View style={styles.brandRule} />
        <View style={styles.brandRuleRed} />

        {data.title ? <Text style={styles.title}>{data.title}</Text> : null}

        {/* Cliente e condições */}
        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Cliente</Text>
            <Text style={[styles.infoLine, { fontFamily: "Helvetica-Bold" }]}>{client.name}</Text>
            {client.companyName ? <Text style={styles.infoLine}>{client.companyName}</Text> : null}
            {client.document ? (
              <Text style={[styles.infoLine, styles.infoMuted]}>CPF/CNPJ: {client.document}</Text>
            ) : null}
            {client.address ? (
              <Text style={[styles.infoLine, styles.infoMuted]}>{client.address}</Text>
            ) : null}
            {localidade ? (
              <Text style={[styles.infoLine, styles.infoMuted]}>{localidade}</Text>
            ) : null}
            {contatos ? <Text style={[styles.infoLine, styles.infoMuted]}>{contatos}</Text> : null}
            {client.email ? (
              <Text style={[styles.infoLine, styles.infoMuted]}>{client.email}</Text>
            ) : null}
            {client.contactName ? (
              <Text style={[styles.infoLine, styles.infoMuted]}>Contato: {client.contactName}</Text>
            ) : null}
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Condições</Text>
            <Text style={styles.infoLine}>
              Vendedor: {data.vendedor.name ?? data.vendedor.email}
            </Text>
            {data.paymentTerms ? (
              <Text style={styles.infoLine}>Pagamento: {data.paymentTerms}</Text>
            ) : null}
            {data.deliveryForecast ? (
              <Text style={styles.infoLine}>Previsão de entrega: {data.deliveryForecast}</Text>
            ) : null}
            {data.deliveryCity ? (
              <Text style={styles.infoLine}>Entrega em: {data.deliveryCity}</Text>
            ) : null}
          </View>
        </View>

        {/* Itens — mesmas colunas da planilha */}
        <View style={styles.tableHeader}>
          <Text style={styles.colCode}>Código</Text>
          <Text style={styles.colDesc}>Descrição</Text>
          <Text style={styles.colValue}>Base cálc.</Text>
          <Text style={styles.colUnit}>Unid.</Text>
          <Text style={styles.colDim}>La.</Text>
          <Text style={styles.colDim}>Com.</Text>
          <Text style={styles.colArea}>M²</Text>
          <Text style={styles.colPartial}>Valor unit.</Text>
          <Text style={styles.colQty}>Qtd</Text>
          <Text style={styles.colTotal}>Total</Text>
        </View>
        {data.items.map((item) => (
          <View key={item.id} style={styles.tableRow} wrap={false}>
            <Text style={styles.colCode}>{item.code ?? "—"}</Text>
            <Text style={styles.colDesc}>{item.description}</Text>
            <Text style={styles.colValue}>{formatCents(item.unitPriceCents)}</Text>
            <Text style={styles.colUnit}>{UNIT_LABEL[item.unit]}</Text>
            <Text style={styles.colDim}>
              {item.widthM != null ? formatDecimal(item.widthM, 3) : "—"}
            </Text>
            <Text style={styles.colDim}>
              {item.lengthM != null ? formatDecimal(item.lengthM, 3) : "—"}
            </Text>
            <Text style={styles.colArea}>
              {item.areaM2 != null ? formatDecimal(item.areaM2, 4) : "—"}
            </Text>
            <Text style={styles.colPartial}>{formatCents(item.partialCents)}</Text>
            <Text style={styles.colQty}>{formatQuantity(item.quantity)}</Text>
            <Text style={[styles.colTotal, { fontFamily: "Helvetica-Bold" }]}>
              {formatCents(item.totalCents)}
            </Text>
          </View>
        ))}

        {/* Totais */}
        <View style={styles.totalsWrap}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsLine}>
              <Text>Valor total do pedido</Text>
              <Text>{formatCents(data.subtotalCents)}</Text>
            </View>
            {data.discountCents > 0 ? (
              <View style={styles.totalsLine}>
                <Text>Desconto</Text>
                <Text>- {formatCents(data.discountCents)}</Text>
              </View>
            ) : null}
            {data.surchargeCents > 0 ? (
              <View style={styles.totalsLine}>
                <Text>Adicional</Text>
                <Text>{formatCents(data.surchargeCents)}</Text>
              </View>
            ) : null}
            {data.freightCents > 0 ? (
              <View style={styles.totalsLine}>
                <Text>Frete</Text>
                <Text>{formatCents(data.freightCents)}</Text>
              </View>
            ) : null}
            {data.taxCents > 0 ? (
              <View style={styles.totalsLine}>
                <Text>Imposto</Text>
                <Text>{formatCents(data.taxCents)}</Text>
              </View>
            ) : null}
            <View style={styles.totalsFinal}>
              <Text style={styles.totalsFinalLabel}>TOTAL FINAL</Text>
              <Text style={styles.totalsFinalValue}>{formatCents(data.totalCents)}</Text>
            </View>
          </View>
        </View>

        {/* Arte do design, quando existe. wrap={false} para a imagem não ser
            partida no meio por uma quebra de página. */}
        {data.arte ? (
          <View style={styles.artBox} wrap={false}>
            <Text style={styles.noteLabel}>
              {data.arte.aprovada ? "Arte aprovada" : "Arte para aprovação"}
            </Text>
            <View style={styles.artFrame}>
              <Image src={data.arte.src} style={styles.artImage} />
            </View>
            {!data.arte.aprovada ? (
              <Text style={styles.artCaption}>
                Confira a arte acima e confirme com o vendedor antes da produção.
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Observações */}
        {data.note ? (
          <View style={styles.noteBox}>
            <Text style={styles.noteLabel}>Observações</Text>
            <Text style={styles.noteText}>{data.note}</Text>
          </View>
        ) : null}

        {/* Cláusulas */}
        <View style={styles.noteBox}>
          {CLAUSULAS.map((clausula) => (
            <Text key={clausula} style={styles.clausula}>
              {clausula}
            </Text>
          ))}
        </View>

        {/* Assinaturas */}
        <View style={styles.signRow} wrap={false}>
          <View style={styles.signCol}>
            <View style={styles.signLine} />
            <Text style={styles.signLabel}>VENDEDOR</Text>
            <Text style={styles.signName}>{data.vendedor.name ?? data.vendedor.email}</Text>
          </View>
          <View style={styles.signCol}>
            <View style={styles.signLine} />
            <Text style={styles.signLabel}>COMPRADOR</Text>
            <Text style={styles.signName}>{client.name}</Text>
          </View>
        </View>

        {/* Rodapé */}
        <View style={styles.footer} fixed>
          <Text>
            {EMPRESA.razao} · CNPJ {EMPRESA.cnpj} · {EMPRESA.endereco} · {EMPRESA.fone}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
