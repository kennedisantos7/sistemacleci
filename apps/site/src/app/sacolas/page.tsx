import { Suspense } from "react";
import Sacolas from "@/views/Sacolas";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Sacolas />
    </Suspense>
  );
}
