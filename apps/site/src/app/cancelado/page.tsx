import Link from "next/link";
import { XCircle } from "lucide-react";

export const metadata = { title: "Pagamento cancelado | Cleci Personaliza" };

export default function CanceladoPage() {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-20 gap-4">
      <XCircle className="w-16 h-16 text-on-surface-variant" />
      <h1 className="font-headline-md text-3xl text-on-background">Pagamento não concluído</h1>
      <p className="font-body-md text-on-surface-variant max-w-md">
        Você cancelou ou o pagamento não foi finalizado. Nenhum valor foi cobrado. Se preferir, fale
        com a gente pelo WhatsApp para concluir seu pedido.
      </p>
      <Link
        href="/produtos"
        className="mt-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
      >
        Voltar aos produtos
      </Link>
    </main>
  );
}
