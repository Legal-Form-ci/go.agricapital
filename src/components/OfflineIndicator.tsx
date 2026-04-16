import { useOnlineSync } from "@/hooks/useOnlineSync";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Petit indicateur discret en haut/à droite.
 * - Vert si en ligne et rien en attente
 * - Orange si en ligne mais des inscriptions en attente de synchro
 * - Rouge si hors ligne
 */
export default function OfflineIndicator() {
  const { online, pending, triggerSync } = useOnlineSync();

  let label: string;
  let icon = <Wifi className="h-3.5 w-3.5" />;
  let tone = "bg-emerald-600 text-white";

  if (!online) {
    label =
      pending > 0
        ? `Hors ligne · ${pending} en attente`
        : "Mode hors ligne";
    icon = <WifiOff className="h-3.5 w-3.5" />;
    tone = "bg-red-600 text-white";
  } else if (pending > 0) {
    label = `Synchronisation… ${pending} en attente`;
    icon = <RefreshCw className="h-3.5 w-3.5 animate-spin" />;
    tone = "bg-amber-500 text-white";
  } else {
    label = "En ligne";
  }

  return (
    <button
      type="button"
      onClick={() => triggerSync()}
      className={cn(
        "fixed top-2 right-2 z-50 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-md backdrop-blur-sm transition-opacity",
        tone,
        online && pending === 0 && "opacity-70 hover:opacity-100",
      )}
      aria-label={label}
      title={label}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
