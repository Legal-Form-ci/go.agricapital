import { useEffect, useState } from "react";
import { CloudOff, Loader2 } from "lucide-react";
import { getQueueCount, onQueueChange } from "@/lib/offlineQueue";

/**
 * Bandeau discret affiché en haut de toutes les pages
 * dès qu'il reste des inscriptions en file locale (pending > 0).
 */
export default function GlobalPendingBanner() {
  const [pending, setPending] = useState(0);
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const refresh = async () => setPending(await getQueueCount());
    refresh();
    const off = onQueueChange(refresh);
    const on = () => setOnline(true);
    const offl = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", offl);
    return () => {
      off();
      window.removeEventListener("online", on);
      window.removeEventListener("offline", offl);
    };
  }, []);

  if (pending <= 0) return null;

  return (
    <div className="sticky top-0 z-50 w-full bg-secondary/95 text-secondary-foreground backdrop-blur-sm border-b border-secondary/30">
      <div className="max-w-7xl mx-auto px-3 py-1.5 flex items-center justify-center gap-2 text-xs sm:text-sm">
        {online ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
        ) : (
          <CloudOff className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className="font-medium">
          {pending} inscription{pending > 1 ? "s" : ""} en file locale
        </span>
        <span className="hidden sm:inline opacity-80">
          — {online ? "synchronisation en cours…" : "sera envoyée au retour du réseau"}
        </span>
      </div>
    </div>
  );
}
