import { Suspense } from "react";
import Seguranca from "@/views/Seguranca";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Seguranca />
    </Suspense>
  );
}
