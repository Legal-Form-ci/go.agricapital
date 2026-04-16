import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CloudOff, RefreshCw } from "lucide-react";
import {
  getQueue,
  onQueueChange,
  syncQueue,
  type QueuedSubmission,
} from "@/lib/offlineQueue";
import { toast } from "sonner";

/**
 * Affiche les inscriptions stockées localement (IndexedDB) qui n'ont pas encore
 * été synchronisées avec le serveur. Utile aux commerciaux sur le terrain pour
 * voir ce qui reste en attente sur leur appareil.
 */
export default function PendingQueueCard() {
  const [items, setItems] = useState<QueuedSubmission[]>([]);
  const [syncing, setSyncing] = useState(false);

  const refresh = async () => {
    try {
      setItems(await getQueue());
    } catch {
      /* noop */
    }
  };

  useEffect(() => {
    refresh();
    const off = onQueueChange(refresh);
    return off;
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

  if (items.length === 0) return null;

  return (
    <Card className="border-amber-300 bg-amber-50/40">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm text-amber-900 flex items-center gap-2">
          <CloudOff className="h-4 w-4" />
          File d'attente locale ({items.length} non synchronisée
          {items.length > 1 ? "s" : ""})
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={handleSync}
          disabled={syncing}
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${syncing ? "animate-spin" : ""}`} />
          Synchroniser
        </Button>
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
