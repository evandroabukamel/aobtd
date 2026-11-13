/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public repository; also used for the "report an error" issue link. */
  readonly VITE_REPO_URL?: string;
  /** Donation pages; a button only shows up when its URL is set. */
  readonly VITE_GITHUB_SPONSORS_URL?: string;
  readonly VITE_KOFI_URL?: string;
  readonly VITE_BUYMEACOFFEE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
