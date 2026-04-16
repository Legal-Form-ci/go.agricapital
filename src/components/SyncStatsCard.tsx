import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, History, RotateCcw } from "lucide-react";
import {
  getSyncStats,
  onSyncStatsChange,
  resetSyncStats,
  type SyncStats,
} from "@/lib/offlineQueue";

/**
 * Carte affichant le compteur de synchronisations réussies/échouées et
 * l'historique des 10 dernières erreurs pour faciliter le debug terrain.
 */
export default function SyncStatsCard() {
  const [stats, setStats] = useState<SyncStats>(() => getSyncStats());
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const refresh = () => setStats(getSyncStats());
    refresh();
    const off = onSyncStatsChange(refresh);
    return off;
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm text-muted-foreground">
          Synchronisation
        </CardTitle>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={() => setShowHistory((v) => !v)}
          >
            <History className="h-3.5 w-3.5 mr-1" />
            {showHistory ? "Masquer" : "Historique"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={() => {
              if (confirm("Réinitialiser les compteurs de synchronisation ?")) {
                resetSyncStats();
              }
            }}
            title="Réinitialiser"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-secondary" />
            <div>
              <p className="text-2xl font-bold text-secondary leading-none">
                {stats.successCount}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Réussies
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-2xl font-bold text-destructive leading-none">
                {stats.failureCount}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Échecs
              </p>
            </div>
          </div>
        </div>
        {stats.lastSyncAt && (
          <p className="text-[11px] text-muted-foreground">
            Dernière synchro : {new Date(stats.lastSyncAt).toLocaleString("fr-FR")}
          </p>
        )}
        {showHistory && (
          <div className="mt-2 border-t pt-2">
            <p className="text-xs font-medium mb-1">
              10 dernières erreurs ({stats.errors.length})
            </p>
            {stats.errors.length === 0 ? (
              <p className="text-xs text-muted-foreground">Aucune erreur enregistrée.</p>
            ) : (
              <ul className="space-y-1 max-h-40 overflow-auto">
                {stats.errors.map((e, i) => (
                  <li
                    key={i}
                    className="text-[11px] border-l-2 border-destructive/60 pl-2"
                  >
                    <div className="text-muted-foreground">
                      {new Date(e.at).toLocaleString("fr-FR")} — {e.payloadSummary}
                    </div>
                    <div className="text-destructive break-words">{e.message}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
