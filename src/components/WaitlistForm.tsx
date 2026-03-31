import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const STORAGE_KEY = "agricapital_waitlist_draft";

const ZONES = [
  "Côte d'Ivoire", "Afrique de l'Ouest", "Diaspora africaine",
  "Diaspora européenne", "Diaspora américaine", "Diaspora asiatique", "Autre"
];

const PROJETS = [
  "Création d'une nouvelle plantation",
  "Développement ou extension d'une plantation existante",
  "Gestion professionnelle d'une plantation",
  "Information sur les projets agricoles"
];

const SUPERFICIES = [
  "1 hectare", "2 hectares", "3 hectares", "5 hectares",
  "10 hectares ou plus", "Je ne sais pas encore"
];

const MOTIVATIONS = [
  "Construire un projet agricole durable",
  "Constituer un patrimoine familial",
  "Préparer une retraite plus sereine",
  "Diversifier mes activités",
  "M'impliquer dans l'agriculture",
  "Recevoir simplement les informations"
];

const TIMINGS = [
  "Dès que possible", "Dans les 6 prochains mois", "Dans l'année",
  "Plus tard", "Je souhaite simplement suivre les informations"
];

const NIVEAUX = [
  "Moins de 2 millions FCFA", "Entre 2 et 5 millions FCFA",
  "Entre 5 et 10 millions FCFA", "Plus de 10 millions FCFA",
  "Je préfère en discuter plus tard"
];

const SOURCES = ["WhatsApp", "Facebook", "LinkedIn", "Recommandation", "Autre"];

interface FormData {
  nom: string;
  zone: string;
  ville: string;
  whatsapp: string;
  email: string;
  possede_terre: boolean | null;
  superficie_terre: string;
  souhait_plantation: string;
  projet_interet: string[];
  superficie_souhaitee: string;
  motivation: string[];
  timing_projet: string;
  niveau_projet: string;
  source: string;
}

const defaultForm: FormData = {
  nom: "", zone: "", ville: "", whatsapp: "", email: "",
  possede_terre: null, superficie_terre: "", souhait_plantation: "",
  projet_interet: [], superficie_souhaitee: "", motivation: [],
  timing_projet: "", niveau_projet: "", source: ""
};

export default function WaitlistForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState<FormData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return { ...defaultForm, ...JSON.parse(saved) }; } catch { /* ignore */ }
    }
    return defaultForm;
  });
  const [loading, setLoading] = useState(false);

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  const update = (field: keyof FormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleMulti = (field: "projet_interet" | "motivation", value: string) => {
    setForm(prev => {
      const arr = prev[field];
      return { ...prev, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom || !form.zone || !form.whatsapp || !form.email) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("waitlist_agricapital").insert({
        nom: form.nom,
        zone: form.zone,
        ville: form.ville || null,
        whatsapp: form.whatsapp,
        email: form.email,
        possede_terre: form.possede_terre ?? false,
        superficie_terre: form.possede_terre ? parseFloat(form.superficie_terre) || null : null,
        souhait_plantation: !form.possede_terre ? form.souhait_plantation || null : null,
        projet_interet: form.projet_interet.length > 0 ? form.projet_interet : null,
        superficie_souhaitee: form.superficie_souhaitee || null,
        motivation: form.motivation.length > 0 ? form.motivation : null,
        timing_projet: form.timing_projet || null,
        niveau_projet: form.niveau_projet || null,
        source: form.source || null,
      });

      if (error) throw error;

      localStorage.removeItem(STORAGE_KEY);
      toast.success("Inscription enregistrée !");
      onSuccess();
    } catch (err: any) {
      toast.error("Erreur lors de l'inscription. Veuillez réessayer.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-lg border p-6 space-y-6">
      {/* 1. Nom */}
      <div className="space-y-2">
        <Label htmlFor="nom">Nom et prénom <span className="text-destructive">*</span></Label>
        <Input id="nom" value={form.nom} onChange={e => update("nom", e.target.value)} placeholder="Votre nom complet" required />
      </div>

      {/* 2. Zone */}
      <div className="space-y-2">
        <Label>Zone de résidence <span className="text-destructive">*</span></Label>
        <Select value={form.zone} onValueChange={v => update("zone", v)}>
          <SelectTrigger><SelectValue placeholder="Sélectionnez votre zone" /></SelectTrigger>
          <SelectContent>
            {ZONES.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* 3. Ville */}
      <div className="space-y-2">
        <Label htmlFor="ville">Ville de résidence</Label>
        <Input id="ville" value={form.ville} onChange={e => update("ville", e.target.value)} placeholder="Votre ville" />
      </div>

      {/* 4. WhatsApp */}
      <div className="space-y-2">
        <Label htmlFor="whatsapp">Numéro WhatsApp <span className="text-destructive">*</span></Label>
        <Input id="whatsapp" type="tel" value={form.whatsapp} onChange={e => update("whatsapp", e.target.value)} placeholder="+225 07 00 00 00 00" required />
      </div>

      {/* 5. Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Adresse email <span className="text-destructive">*</span></Label>
        <Input id="email" type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="votre@email.com" required />
      </div>

      {/* 6. Possède terre */}
      <div className="space-y-3">
        <Label>Possédez-vous déjà des terres agricoles ?</Label>
        <RadioGroup
          value={form.possede_terre === null ? "" : form.possede_terre ? "oui" : "non"}
          onValueChange={v => update("possede_terre", v === "oui")}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="oui" id="terre-oui" />
            <Label htmlFor="terre-oui" className="font-normal">Oui</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="non" id="terre-non" />
            <Label htmlFor="terre-non" className="font-normal">Non</Label>
          </div>
        </RadioGroup>
      </div>

      {/* 7. Superficie terre (si oui) */}
      {form.possede_terre === true && (
        <div className="space-y-2 pl-4 border-l-2 border-primary/30">
          <Label htmlFor="superficie_terre">Superficie approximative de votre terrain (hectares)</Label>
          <Input id="superficie_terre" type="number" min="0" step="0.5" value={form.superficie_terre} onChange={e => update("superficie_terre", e.target.value)} placeholder="Ex: 5" />
        </div>
      )}

      {/* 8. Souhait plantation (si non) */}
      {form.possede_terre === false && (
        <div className="space-y-3 pl-4 border-l-2 border-primary/30">
          <Label>Souhaiteriez-vous développer une plantation agricole ?</Label>
          <RadioGroup value={form.souhait_plantation} onValueChange={v => update("souhait_plantation", v)}>
            {["Oui", "Peut-être", "Je souhaite simplement m'informer"].map(opt => (
              <div key={opt} className="flex items-center space-x-2">
                <RadioGroupItem value={opt} id={`souhait-${opt}`} />
                <Label htmlFor={`souhait-${opt}`} className="font-normal">{opt}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}

      {/* 9. Projet intérêt */}
      <div className="space-y-3">
        <Label>Type de projet agricole qui vous intéresse</Label>
        <div className="space-y-2">
          {PROJETS.map(p => (
            <div key={p} className="flex items-center space-x-2">
              <Checkbox
                id={`projet-${p}`}
                checked={form.projet_interet.includes(p)}
                onCheckedChange={() => toggleMulti("projet_interet", p)}
              />
              <Label htmlFor={`projet-${p}`} className="font-normal text-sm">{p}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* 10. Superficie souhaitée */}
      <div className="space-y-2">
        <Label>Superficie que vous envisageriez pour votre projet</Label>
        <Select value={form.superficie_souhaitee} onValueChange={v => update("superficie_souhaitee", v)}>
          <SelectTrigger><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
          <SelectContent>
            {SUPERFICIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* 11. Motivation */}
      <div className="space-y-3">
        <Label>Pourquoi souhaitez-vous développer une plantation agricole ?</Label>
        <div className="space-y-2">
          {MOTIVATIONS.map(m => (
            <div key={m} className="flex items-center space-x-2">
              <Checkbox
                id={`motiv-${m}`}
                checked={form.motivation.includes(m)}
                onCheckedChange={() => toggleMulti("motivation", m)}
              />
              <Label htmlFor={`motiv-${m}`} className="font-normal text-sm">{m}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* 12. Timing */}
      <div className="space-y-2">
        <Label>Dans quel délai envisageriez-vous ce projet ?</Label>
        <Select value={form.timing_projet} onValueChange={v => update("timing_projet", v)}>
          <SelectTrigger><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
          <SelectContent>
            {TIMINGS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* 13. Niveau projet */}
      <div className="space-y-2">
        <Label>Quel niveau de projet envisageriez-vous progressivement ?</Label>
        <Select value={form.niveau_projet} onValueChange={v => update("niveau_projet", v)}>
          <SelectTrigger><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
          <SelectContent>
            {NIVEAUX.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* 14. Source */}
      <div className="space-y-2">
        <Label>Comment avez-vous entendu parler d'AgriCapital ?</Label>
        <Select value={form.source} onValueChange={v => update("source", v)}>
          <SelectTrigger><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
          <SelectContent>
            {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Submit */}
      <Button type="submit" disabled={loading} className="w-full text-base py-6 bg-primary hover:bg-primary/90">
        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
        Rejoindre la liste d'attente
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Les informations collectées sont confidentielles et utilisées uniquement pour vous informer des initiatives agricoles développées par AgriCapital.
      </p>
    </form>
  );
}
