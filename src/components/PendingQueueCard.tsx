import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CloudOff, RefreshCw, Trash2, Download, AlertTriangle } from "lucide-react";
import {
  clearQueue,
  getOldestPendingAge,
  getQueue,
  onQueueChange,
  removeFromQueue,
  syncQueue,
  type QueuedSubmission,
} from "@/lib/offlineQueue";
import { toast } from "sonner";

/**
 * Affiche les inscriptions stockées localement (IndexedDB) qui n'ont pas encore
 * été synchronisées avec le serveur. Permet de supprimer une entrée erronée et
 * d'exporter la file en CSV pour envoi manuel.
 */
export default function PendingQueueCard() {
  const [items, setItems] = useState<QueuedSubmission[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [oldestAgeMs, setOldestAgeMs] = useState<number | null>(null);

  const refresh = async () => {
    try {
      setItems(await getQueue());
      setOldestAgeMs(await getOldestPendingAge());
    } catch {
      /* noop */
    }
  };

  useEffect(() => {
    refresh();
    const off = onQueueChange(refresh);
    // re-évaluer l'âge toutes les minutes pour la bannière 24h
    const t = window.setInterval(refresh, 60_000);
    return () => {
      off();
      window.clearInterval(t);
    };
  }, []);

  const handleSync = async () => {
    if (!navigator.onLine) {
      toast.error("Aucune connexion internet détectée.");
      return;
    }
    setSyncing(true);
    const { ok, failed } = await syncQueue();
    setSyncing(false);
    await refresh();
    if (ok > 0) toast.success(`${ok} inscription(s) synchronisée(s).`);
    if (ok === 0 && failed === 0) toast.info("Rien à synchroniser.");
    if (failed > 0) toast.error(`${failed} échec(s) de synchronisation.`);
  };

  const handleDelete = async (id?: number) => {
    if (id == null) return;
    if (!confirm("Supprimer définitivement cette inscription locale ?")) return;
    await removeFromQueue(id);
    await refresh();
    toast.success("Inscription locale supprimée.");
  };

  const handleClearAll = async () => {
    if (items.length === 0) return;
    if (
      !confirm(
        `⚠️ Supprimer définitivement les ${items.length} inscription(s) en file locale ?\n\nCette action est irréversible. Aucune donnée ne sera envoyée au serveur.`,
      )
    )
      return;
    const n = await clearQueue();
    await refresh();
    toast.success(`${n} inscription(s) locale(s) supprimée(s).`);
  };

  const handleExportCSV = () => {
    if (items.length === 0) {
      toast.info("File vide.");
      return;
    }
    const headers = [
      "Nom",
      "WhatsApp",
      "Email",
      "Zone",
      "Ville",
      "Terre",
      "Superficie terre (ha)",
      "Projet intérêt",
      "Superficie souhaitée",
      "Motivation",
      "Délai projet",
      "Niveau projet",
      "Prêt Daloa",
      "Source",
      "Tentatives",
      "Dernière erreur",
      "Créé le",
    ];
    const escape = (v: unknown) => {
      const s = v == null ? "" : Array.isArray(v) ? v.join(" | ") : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const lines = items.map((it) => {
      const p = it.payload as Record<string, unknown>;
      return [
        p.nom,
        p.whatsapp,
        p.email,
        p.zone,
        p.ville,
        p.possede_terre ? "Oui" : "Non",
        p.superficie_terre,
        p.projet_interet,
        p.superficie_souhaitee,
        p.motivation,
        p.timing_projet,
        p.niveau_projet,
        p.pret_daloa,
        p.source,
        it.attempts,
        it.lastError ?? "",
        new Date(it.createdAt).toISOString(),
      ]
        .map(escape)
        .join(",");
    });
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `agricapital_file_locale_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success("Export CSV généré.");
  };

  if (items.length === 0) return null;

  return (
    <Card className="border-amber-300 bg-amber-50/40">
      <CardHeader className="pb-2 flex flex-row items-center justify-between flex-wrap gap-2">
        <CardTitle className="text-sm text-amber-900 flex items-center gap-2">
          <CloudOff className="h-4 w-4" />
          File d'attente locale ({items.length} non synchronisée
          {items.length > 1 ? "s" : ""})
        </CardTitle>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={handleExportCSV}>
            <Download className="h-3.5 w-3.5 mr-1" />
            Exporter CSV
          </Button>
          <Button size="sm" variant="outline" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${syncing ? "animate-spin" : ""}`} />
            Synchroniser
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-amber-900/80 mb-3">
          Ces inscriptions sont enregistrées sur cet appareil uniquement et seront
          envoyées automatiquement au serveur dès qu'une connexion stable est
          détectée.
        </p>
        <div className="border rounded-md overflow-auto bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Tentatives</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="w-12 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const p = item.payload as Record<string, unknown>;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap">{String(p.nom ?? "—")}</TableCell>
                    <TableCell className="whitespace-nowrap">{String(p.whatsapp ?? "—")}</TableCell>
                    <TableCell>{String(p.email ?? "—")}</TableCell>
                    <TableCell className="whitespace-nowrap">{String(p.zone ?? "—")}</TableCell>
                    <TableCell>{item.attempts}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
