/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_BASE?: string;
  readonly VITE_EMPTY_LIBRARY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
