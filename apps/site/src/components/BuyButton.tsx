"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";

export default function BuyButton({
  productId,
  className = "",
}: {
  productId: string | number;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBuy() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: String(productId) }),
      });
      const data = (await res.json()) as { checkoutUrl?: string; error?: string };
      if (!res.ok || !data.checkoutUrl) {
        setError(data.error ?? "Não foi possível iniciar o pagamento.");
        setLoading(false);
        return;
      }
      // Redireciona para o checkout do Stripe.
      window.location.href = data.checkoutUrl;
    } catch {
      setError("Falha de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleBuy}
        disabled={loading}
        className="flex w-full bg-primary text-white font-bold py-5 px-8 rounded-xl uppercase tracking-widest justify-center items-center gap-3 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-[0.98] disabled:opacity-60"
      >
        <ShoppingCart className="w-5 h-5" />
        {loading ? "Redirecionando..." : "Comprar agora"}
      </button>
      {error ? <p className="text-sm text-red-600 text-center">{error}</p> : null}
    </div>
  );
}
