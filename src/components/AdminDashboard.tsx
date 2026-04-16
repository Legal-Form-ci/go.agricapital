import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogOut, Download, Users, CalendarDays, MapPin, Ruler } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import logoAgricapital from "@/assets/logo-agricapital.png";
import PendingQueueCard from "./PendingQueueCard";

type Inscription = {
  id: string;
  nom: string;
  zone: string;
  ville: string | null;
  whatsapp: string;
  email: string;
  possede_terre: boolean;
  superficie_terre: number | null;
  souhait_plantation: string | null;
  projet_interet: string[] | null;
  superficie_souhaitee: string | null;
  motivation: string[] | null;
  timing_projet: string | null;
  niveau_projet: string | null;
  source: string | null;
  pret_daloa: string | null;
  date_inscription: string;
};

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [data, setData] = useState<Inscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterZone, setFilterZone] = useState("all");
  const [filterSuperficie, setFilterSuperficie] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: rows, error } = await supabase
      .from("waitlist_agricapital")
      .select("*")
      .order("date_inscription", { ascending: false });
    if (error) { toast.error("Erreur de chargement"); console.error(error); }
    else setData(rows as Inscription[]);
    setLoading(false);
  };

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = data.filter(d => d.date_inscription.slice(0, 10) === today).length;

  const zones = useMemo(() => [...new Set(data.map(d => d.zone))], [data]);
  const superficies = useMemo(() => [...new Set(data.map(d => d.superficie_souhaitee).filter(Boolean))], [data]);

  const filtered = useMemo(() => {
    return data.filter(d => {
      if (filterZone !== "all" && d.zone !== filterZone) return false;
      if (filterSuperficie !== "all" && d.superficie_souhaitee !== filterSuperficie) return false;
      if (search && !d.nom.toLowerCase().includes(search.toLowerCase()) && !d.email.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [data, filterZone, filterSuperficie, search]);

  const zoneStats = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(d => { map[d.zone] = (map[d.zone] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [data]);

  const superficieStats = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(d => {
      const key = d.superficie_souhaitee || "Non renseigné";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [data]);

  const exportRows = (rows: Inscription[]) => rows.map(r => ({
    Nom: r.nom, Zone: r.zone, Ville: r.ville || "",
    WhatsApp: r.whatsapp, Email: r.email,
    "Terre disponible": r.possede_terre ? "Oui" : "Non",
    "Superficie terrain": r.superficie_terre ?? "",
    "Projet intérêt": r.projet_interet?.join(", ") || "",
    "Superficie souhaitée": r.superficie_souhaitee || "",
    Motivation: r.motivation?.join(", ") || "",
    "Délai projet": r.timing_projet || "",
    "Niveau projet": r.niveau_projet || "",
    "Prêt Daloa": r.pret_daloa || "",
    Source: r.source || "",
    "Date inscription": r.date_inscription,
  }));

  const downloadCSV = () => {
    const rows = exportRows(filtered);
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => `"${(r as any)[h]}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `agricapital_waitlist_${today}.csv`; a.click();
  };

  const downloadExcel = () => {
    const rows = exportRows(filtered);
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inscriptions");
    XLSX.writeFile(wb, `agricapital_waitlist_${today}.xlsx`);
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center"><p>Chargement...</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logoAgricapital} alt="AgriCapital" className="h-10" />
          <span className="font-semibold text-foreground">Administration</span>
        </div>
        <Button variant="outline" size="sm" onClick={onLogout}>
          <LogOut className="h-4 w-4 mr-2" /> Déconnexion
        </Button>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <PendingQueueCard />
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4" /> Total inscriptions</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-primary">{data.length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Aujourd'hui</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-secondary">{todayCount}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4" /> Par zone</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {zoneStats.slice(0, 3).map(([zone, count]) => (
                <p key={zone} className="text-xs"><span className="font-medium">{zone}</span>: {count}</p>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Ruler className="h-4 w-4" /> Par superficie</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {superficieStats.slice(0, 3).map(([sup, count]) => (
                <p key={sup} className="text-xs"><span className="font-medium">{sup}</span>: {count}</p>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Filters & Export */}
        <div className="flex flex-wrap gap-3 items-center">
          <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="w-48" />
          <Select value={filterZone} onValueChange={setFilterZone}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Zone" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les zones</SelectItem>
              {zones.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterSuperficie} onValueChange={setFilterSuperficie}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Superficie" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes superficies</SelectItem>
              {superficies.map(s => <SelectItem key={s!} value={s!}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={downloadCSV}><Download className="h-4 w-4 mr-1" /> CSV</Button>
            <Button variant="outline" size="sm" onClick={downloadExcel}><Download className="h-4 w-4 mr-1" /> Excel</Button>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Terre</TableHead>
                <TableHead>Superficie</TableHead>
                <TableHead>Motivation</TableHead>
                <TableHead>Délai</TableHead>
                <TableHead>Niveau</TableHead>
                <TableHead>Daloa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(row => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium whitespace-nowrap">{row.nom}</TableCell>
                  <TableCell className="whitespace-nowrap">{row.zone}</TableCell>
                  <TableCell>{row.ville || "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">{row.whatsapp}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.possede_terre ? "Oui" : "Non"}</TableCell>
                  <TableCell>{row.superficie_souhaitee || (row.superficie_terre ? `${row.superficie_terre} ha` : "—")}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{row.motivation?.join(", ") || "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">{row.timing_projet || "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">{row.niveau_projet || "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">{row.pret_daloa || "—"}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">Aucune inscription trouvée.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <p className="text-sm text-muted-foreground">{filtered.length} inscription(s) affichée(s)</p>
      </main>
    </div>
  );
}
