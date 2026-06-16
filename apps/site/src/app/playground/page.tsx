import { Suspense } from "react";
import Playground from "@/views/Playground";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Playground />
    </Suspense>
  );
}
