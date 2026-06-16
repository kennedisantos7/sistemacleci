"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { captureRefFromUrl } from "../lib/attribution";

/**
 * Captura o ?ref= da URL e grava o cookie first-party de atribuição.
 * Reexecuta quando a query muda (navegação client-side).
 */
export default function AttributionTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    captureRefFromUrl();
  }, [searchParams]);

  return null;
}
