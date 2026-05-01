import { useEffect, useState, useCallback } from "react";
import {
  getOldestPendingAge,
  getQueueCount,
  onQueueChange,
  syncQueue,
} from "@/lib/offlineQueue";
import { getCommercialId } from "@/lib/commercialId";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Numéro support AgriCapital (sans +) — alerte si retard de synchro > 24h
const SUPPORT_WHATSAPP = "2250564551717";
const STALE_THRESHOLD_MS = 24 * 3600 * 1000;
const STALE_EMAIL_THRESHOLD_MS = 48 * 3600 * 1000;
const STALE_ALERT_KEY = "agricapital-stale-alert-sent";
const STALE_EMAIL_ALERT_KEY = "agricapital-stale-email-sent";
const STALE_ALERT_COOLDOWN_MS = 6 * 3600 * 1000; // ne pas re-spammer plus d'1x / 6h
const STALE_EMAIL_COOLDOWN_MS = 12 * 3600 * 1000;

/**
 * Si la file locale contient une inscription qui attend depuis plus de 24h,
 * et que le réseau vient de revenir, on ouvre WhatsApp prérempli vers le
 * support pour signaler le retard. Cooldown 6h pour éviter le spam.
 */
async function maybeAlertSupportStaleQueue() {
  try {
    const age = await getOldestPendingAge();
    const count = await getQueueCount();
    if (age == null || age < STALE_THRESHOLD_MS || count === 0) return;

    const commercialId = getCommercialId() || "(non renseigné)";
    const hours = Math.floor(age / 3600_000);

    // ---- 1. Email automatique au support si > 48h (cooldown 12h) ----
    if (age >= STALE_EMAIL_THRESHOLD_MS) {
      const lastEmail = Number(localStorage.getItem(STALE_EMAIL_ALERT_KEY) || "0");
      if (Date.now() - lastEmail >= STALE_EMAIL_COOLDOWN_MS) {
        localStorage.setItem(STALE_EMAIL_ALERT_KEY, String(Date.now()));
        try {
          await supabase.functions.invoke("notify-stale-queue", {
            body: {
              commercialId,
              pendingCount: count,
              oldestAgeHours: hours,
              userAgent: navigator.userAgent,
              url: window.location.href,
            },
          });
        } catch (e) {
          console.warn("notify-stale-queue invoke failed", e);
        }
      }
    }

    // ---- 2. Toast WhatsApp au commercial (cooldown 6h) ----
    const lastAlert = Number(localStorage.getItem(STALE_ALERT_KEY) || "0");
    if (Date.now() - lastAlert < STALE_ALERT_COOLDOWN_MS) return;
    localStorage.setItem(STALE_ALERT_KEY, String(Date.now()));

    const message = encodeURIComponent(
      `🔴 [AgriCapital — Retard de synchro]\n` +
        `Commercial : ${commercialId}\n` +
        `${count} inscription(s) en file locale non synchronisée(s) depuis ${hours}h.\n` +
        `Appareil : ${navigator.userAgent.split(")")[0]})\n` +
        `Heure : ${new Date().toLocaleString("fr-FR")}\n` +
        `Merci de vérifier la connexion ou récupérer le CSV via /admin.`,
    );
    const url = `https://wa.me/${SUPPORT_WHATSAPP}?text=${message}`;

    toast.warning("Retard de synchronisation détecté (>24h)", {
      description:
        "Notifiez le support WhatsApp pour qu'il vérifie votre situation.",
      duration: 15_000,
      action: {
        label: "Ouvrir WhatsApp",
        onClick: () => window.open(url, "_blank", "noopener,noreferrer"),
      },
    });
  } catch {
    /* noop */
  }
}


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
    // Vérifie si la file est ancienne AVANT d'envoyer (sinon l'âge sera reset)
    await maybeAlertSupportStaleQueue();
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
