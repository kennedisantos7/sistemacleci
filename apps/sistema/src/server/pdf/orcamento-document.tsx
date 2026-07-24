import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { formatCents, formatQuantity } from "@/lib/money";

// Identidade Cleci
const BLUE = "#1541FC";
const RED = "#FE0000";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 44,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1c1c",
  },

  // Cabeçalho
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  logo: { width: 90, height: 54, objectFit: "contain" },
  headerRight: { alignItems: "flex-end" },
  docTitle: { fontSize: 18, fontFamily: "Helvetica-Bold", color: BLUE },
  docNumber: { fontSize: 11, color: MUTED, marginTop: 2 },
  brandRule: { height: 3, backgroundColor: BLUE, marginBottom: 2 },
  brandRuleRed: { height: 2, backgroundColor: RED, marginBottom: 16 },

  // Blocos de informação
  infoRow: { flexDirection: "row", gap: 16, marginBottom: 16 },
  infoBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    padding: 10,
  },
  infoLabel: {
    fontSize: 8,
    color: BLUE,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  infoLine: { marginBottom: 2 },
  infoMuted: { color: MUTED },

  // Tabela de itens
  tableHeader: {
    flexDirection: "row",
    backgroundColor: BLUE,
    color: "#ffffff",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  colDesc: { flex: 1, paddingRight: 8 },
  colQty: { width: 60, textAlign: "right" },
  colUnit: { width: 80, textAlign: "right" },
  colTotal: { width: 85, textAlign: "right" },

  // Total
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  totalLabel: { fontSize: 11, color: MUTED },
  totalValue: { fontSize: 16, fontFamily: "Helvetica-Bold", color: BLUE },

  // Observações
  noteBox: { marginTop: 18 },
  noteLabel: {
    fontSize: 8,
    color: BLUE,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  noteText: { color: "#374151", lineHeight: 1.5 },

  // Rodapé
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
    fontSize: 8,
    color: MUTED,
    textAlign: "center",
  },
});

export type OrcamentoPdfData = {
  number: number;
  createdAt: Date;
  validUntil: Date | null;
  title: string | null;
  note: string | null;
  totalCents: number;
  client: {
    name: string;
    companyName: string | null;
    document: string | null;
    email: string | null;
    phone: string | null;
  };
  vendedor: { name: string | null; email: string };
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
  }>;
  /** Data URI do logo (ou null para omitir). */
  logoSrc: string | null;
};

function fmtDate(d: Date): string {
  return d.toLocaleDateString("pt-BR");
}

export function OrcamentoDocument({ data }: { data: OrcamentoPdfData }) {
  return (
    <Document
      title={`Orçamento #${data.number} — Cleci Personaliza`}
      author="Cleci Personaliza"
    >
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          {data.logoSrc ? (
            <Image src={data.logoSrc} style={styles.logo} />
          ) : (
            <Text style={{ fontSize: 20, fontFamily: "Helvetica-Bold", color: BLUE }}>
              Cleci Personaliza
            </Text>
          )}
          <View style={styles.headerRight}>
            <Text style={styles.docTitle}>ORÇAMENTO</Text>
            <Text style={styles.docNumber}>
              Nº {String(data.number).padStart(4, "0")} · {fmtDate(data.createdAt)}
            </Text>
            {data.validUntil ? (
              <Text style={styles.docNumber}>Válido até {fmtDate(data.validUntil)}</Text>
            ) : null}
          </View>
        </View>
        <View style={styles.brandRule} />
        <View style={styles.brandRuleRed} />

        {data.title ? (
          <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 12 }}>
            {data.title}
          </Text>
        ) : null}

        {/* Cliente e vendedor */}
        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Cliente</Text>
            <Text style={[styles.infoLine, { fontFamily: "Helvetica-Bold" }]}>
              {data.client.name}
            </Text>
            {data.client.companyName ? (
              <Text style={styles.infoLine}>{data.client.companyName}</Text>
            ) : null}
            {data.client.document ? (
              <Text style={[styles.infoLine, styles.infoMuted]}>CPF/CNPJ: {data.client.document}</Text>
            ) : null}
            {data.client.phone ? (
              <Text style={[styles.infoLine, styles.infoMuted]}>Tel: {data.client.phone}</Text>
            ) : null}
            {data.client.email ? (
              <Text style={[styles.infoLine, styles.infoMuted]}>{data.client.email}</Text>
            ) : null}
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Vendedor</Text>
            <Text style={[styles.infoLine, { fontFamily: "Helvetica-Bold" }]}>
              {data.vendedor.name ?? data.vendedor.email}
            </Text>
            <Text style={[styles.infoLine, styles.infoMuted]}>{data.vendedor.email}</Text>
            <Text style={[styles.infoLine, styles.infoMuted]}>CLECI PERSONALIZA LTDA</Text>
            <Text style={[styles.infoLine, styles.infoMuted]}>CNPJ: 28.402.051/0001-69</Text>
          </View>
        </View>

        {/* Itens */}
        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Descrição</Text>
          <Text style={styles.colQty}>Qtd</Text>
          <Text style={styles.colUnit}>Preço un.</Text>
          <Text style={styles.colTotal}>Total</Text>
        </View>
        {data.items.map((item) => (
          <View key={item.id} style={styles.tableRow} wrap={false}>
            <Text style={styles.colDesc}>{item.description}</Text>
            <Text style={styles.colQty}>{formatQuantity(item.quantity)}</Text>
            <Text style={styles.colUnit}>{formatCents(item.unitPriceCents)}</Text>
            <Text style={[styles.colTotal, { fontFamily: "Helvetica-Bold" }]}>
              {formatCents(item.totalCents)}
            </Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>{formatCents(data.totalCents)}</Text>
        </View>

        {/* Observações */}
        {data.note ? (
          <View style={styles.noteBox}>
            <Text style={styles.noteLabel}>Observações</Text>
            <Text style={styles.noteText}>{data.note}</Text>
          </View>
        ) : null}

        {/* Rodapé */}
        <View style={styles.footer} fixed>
          <Text>
            CLECI PERSONALIZA LTDA · CNPJ 28.402.051/0001-69 · Rua Belmiro da Silva Prado, Qd 20 Lt
            02, Nova Capital, Porto Nacional - TO · (63) 9 9234-9085 · cleci.com.br
          </Text>
        </View>
      </Page>
    </Document>
  );
}
