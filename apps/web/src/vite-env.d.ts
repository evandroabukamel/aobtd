/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API origin when it is not this site's own origin, e.g. https://api.example.com. */
  readonly VITE_API_URL?: string;
  /** Public repository; also used for the "report an error" issue link. */
  readonly VITE_REPO_URL?: string;
  /** Donation pages; a button only shows up when its URL is set. */
  readonly VITE_GITHUB_SPONSORS_URL?: string;
  readonly VITE_KOFI_URL?: string;
  readonly VITE_BUYMEACOFFEE_URL?: string;
  /** Pix donation: the button only shows up when the copy-and-paste code is set and valid. */
  readonly VITE_PIX_CODE?: string;
  readonly VITE_PIX_KEY?: string;
  readonly VITE_PIX_NAME?: string;
  readonly VITE_PIX_REFERENCE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
