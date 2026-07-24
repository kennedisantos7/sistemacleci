import fs from "node:fs";
import path from "node:path";
import { createElement, type ReactElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import { OrcamentoDocument, type OrcamentoPdfData } from "./orcamento-document";

let _logoSrc: string | null | undefined;

/** Logo como data URI (lida uma vez do disco; null se o arquivo não existir). */
function getLogoSrc(): string | null {
  if (_logoSrc !== undefined) return _logoSrc;
  try {
    const file = path.join(process.cwd(), "public", "logo-cleci.jpg");
    _logoSrc = `data:image/jpeg;base64,${fs.readFileSync(file).toString("base64")}`;
  } catch {
    _logoSrc = null; // sem logo, o documento usa o wordmark em texto
  }
  return _logoSrc;
}

export async function renderOrcamentoPdf(
  data: Omit<OrcamentoPdfData, "logoSrc">,
): Promise<Buffer> {
  const element = createElement(OrcamentoDocument, {
    data: { ...data, logoSrc: getLogoSrc() },
  }) as unknown as ReactElement<DocumentProps>;
  return renderToBuffer(element);
}
