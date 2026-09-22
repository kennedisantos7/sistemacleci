"use client";

import { useEffect } from "react";

/**
 * Avisa o usuário se ele tentar sair da tela (fechar/atualizar a aba, ou
 * clicar em qualquer link) enquanto o documento ainda está pendente de uma
 * ação (ex.: rascunho nunca enviado ao cliente). Não bloqueia botões/forms
 * da própria tela (ex.: "Marcar como enviado"), só navegação para fora dela.
 *
 * Links marcados com `data-skip-leave-guard` (ex.: "Editar", "Baixar PDF")
 * não disparam o aviso, pois fazem parte do fluxo normal.
 */
export function DraftLeaveGuard({ message }: { message: string }) {
  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;
      if (anchor.hasAttribute("download") || anchor.dataset.skipLeaveGuard !== undefined) return;
      if (anchor.target === "_blank") return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      if (!window.confirm(message)) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleClick, true);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleClick, true);
    };
  }, [message]);

  return null;
}
