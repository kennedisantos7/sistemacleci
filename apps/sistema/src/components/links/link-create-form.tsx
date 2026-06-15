"use client";

import { useActionState, useEffect, useRef } from "react";
import { createLinkAction, type LinkFormState } from "@/server/actions/links";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial: LinkFormState = {};

export function LinkCreateForm() {
  const [state, action, pending] = useActionState(createLinkAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={action} className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1 sm:col-span-2">
        <label htmlFor="slug" className="text-sm font-medium">
          Caminho do produto/campanha (opcional)
        </label>
        <Input id="slug" name="slug" placeholder="/tapetes ou /produto/abc" />
        <p className="text-xs text-muted-foreground">
          Vazio aponta para a home do site. Ex.: <code>/tapetes</code>
        </p>
      </div>
      <div className="space-y-1">
        <label htmlFor="utmSource" className="text-sm font-medium">
          utm_source (opcional)
        </label>
        <Input id="utmSource" name="utmSource" placeholder="instagram" />
      </div>
      <div className="space-y-1">
        <label htmlFor="utmCampaign" className="text-sm font-medium">
          utm_campaign (opcional)
        </label>
        <Input id="utmCampaign" name="utmCampaign" placeholder="natal2026" />
      </div>

      {state.error ? <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p> : null}

      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Gerando..." : "Gerar link"}
        </Button>
      </div>
    </form>
  );
}
