import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const metadata = { title: "Pedido confirmado | Cleci Personaliza" };

export default function SucessoPage() {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-20 gap-4">
      <CheckCircle2 className="w-16 h-16 text-[#25D366]" />
      <h1 className="font-headline-md text-3xl text-on-background">Pagamento confirmado!</h1>
      <p className="font-body-md text-on-surface-variant max-w-md">
        Recebemos seu pedido. Em breve entraremos em contato com os detalhes da produção e entrega.
        Obrigado por comprar com a Cleci Personaliza!
      </p>
      <Link
        href="/"
        className="mt-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
      >
        Voltar à página inicial
      </Link>
    </main>
  );
}
