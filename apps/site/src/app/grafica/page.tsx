import { Suspense } from "react";
import Grafica from "@/views/Grafica";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Grafica />
    </Suspense>
  );
}
