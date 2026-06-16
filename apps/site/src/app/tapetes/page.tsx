import { Suspense } from "react";
import Tapetes from "@/views/Tapetes";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Tapetes />
    </Suspense>
  );
}
