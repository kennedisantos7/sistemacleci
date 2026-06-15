/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ATTRIBUTION_COOKIE_DAYS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
