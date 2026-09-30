"use client";

import type { AnchorHTMLAttributes } from "react";
import { WA_BASE, buildContactLink } from "../lib/whatsapp";

/**
 * Botão de contato pelo WhatsApp que carrega o ref do afiliado. O href inicial
 * é o do servidor (sem ref); o clique regrava o href antes da navegação, quando
 * o cookie de atribuição já foi lido.
 */
export default function WhatsAppContactLink(
  props: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick">,
) {
  return (
    <a
      {...props}
      href={WA_BASE}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        e.currentTarget.href = buildContactLink();
      }}
    />
  );
}
