import { Suspense } from "react";
import MesasFreezers from "@/views/MesasFreezers";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <MesasFreezers />
    </Suspense>
  );
}
