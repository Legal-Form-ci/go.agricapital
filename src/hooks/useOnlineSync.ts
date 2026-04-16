import { useEffect, useState, useCallback } from "react";
import {
  getQueueCount,
  onQueueChange,
  syncQueue,
} from "@/lib/offlineQueue";
import { toast } from "sonner";

/**
 * Hook qui :
 *  - expose l'état online/offline
 *  - expose le nombre d'éléments en file d'attente
 *  - déclenche une synchronisation auto au retour réseau (même 2G)
 *  - tente une re-synchro périodique légère (toutes les 30s) si du contenu reste en attente
 */
export function useOnlineSync() {
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [pending, setPending] = useState<number>(0);

  const refreshCount = useCallback(async () => {
    try {
      setPending(await getQueueCount());
    } catch {
      /* noop */
    }
  }, []);

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine) return;
    const before = await getQueueCount();
    if (before === 0) return;
    const { ok, failed } = await syncQueue();
    await refreshCount();
    if (ok > 0) {
      toast.success(
        ok === 1
          ? "1 inscription synchronisée."
          : `${ok} inscriptions synchronisées.`,
      );
    }
    if (failed > 0 && ok === 0) {
      // silencieux : on retentera automatiquement
    }
  }, [refreshCount]);

  useEffect(() => {
    refreshCount();
    const offChange = onQueueChange(refreshCount);

    const handleOnline = () => {
      setOnline(true);
      // petit délai pour laisser le réseau se stabiliser (utile en 2G)
      setTimeout(() => triggerSync(), 800);
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Détection fine via Network Information API (changement de type de réseau)
    const nav = navigator as Navigator & {
      connection?: { addEventListener: (e: string, cb: () => void) => void; removeEventListener: (e: string, cb: () => void) => void };
    };
    const conn = nav.connection;
    const onConnChange = () => {
      if (navigator.onLine) triggerSync();
    };
    conn?.addEventListener?.("change", onConnChange);

    // Sync initiale si en ligne
    if (navigator.onLine) triggerSync();

    // Retentatives périodiques tant qu'il reste des éléments
    const interval = window.setInterval(() => {
      if (navigator.onLine) triggerSync();
    }, 30_000);

    // Sync au retour de visibilité (utilisateur réouvre l'app)
    const onVisibility = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        triggerSync();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      offChange();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      conn?.removeEventListener?.("change", onConnChange);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(interval);
    };
  }, [refreshCount, triggerSync]);

  return { online, pending, triggerSync };
}
