import { Suspense } from "react";
import ComunicacaoVisual from "@/views/ComunicacaoVisual";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ComunicacaoVisual />
    </Suspense>
  );
}
