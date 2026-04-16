import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// ---- PWA Service Worker registration ----
// Garde-fous : on n'enregistre PAS le SW dans :
//  - les iframes (preview Lovable)
//  - les hôtes de prévisualisation Lovable
//  - les environnements de dev
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const host = window.location.hostname;
const isPreviewHost =
  host.includes("id-preview--") ||
  host.includes("lovableproject.com") ||
  host.includes("lovable.app");

if (isInIframe || isPreviewHost) {
  // Nettoie tout SW existant en contexte preview/iframe
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
  }
} else if (import.meta.env.PROD && "serviceWorker" in navigator) {
  // Enregistrement en production sur le domaine final
  import("virtual:pwa-register")
    .then(({ registerSW }) => {
      registerSW({ immediate: true });
    })
    .catch(() => {
      /* noop */
    });
}
