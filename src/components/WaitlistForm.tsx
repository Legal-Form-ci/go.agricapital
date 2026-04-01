import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, ChevronRight } from "lucide-react";

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

const DALOA_OPTIONS = [
  "Oui, je suis ouvert(e) à Daloa",
  "Oui, sous réserve d'informations complémentaires",
  "Non, je privilégie une autre zone",
  "Je souhaite d'abord en savoir plus"
];

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
  pret_daloa: string;
}

const defaultForm: FormData = {
  nom: "", zone: "", ville: "", whatsapp: "", email: "",
  possede_terre: null, superficie_terre: "", souhait_plantation: "",
  projet_interet: [], superficie_souhaitee: "", motivation: [],
  timing_projet: "", niveau_projet: "", source: "", pret_daloa: ""
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
        pret_daloa: form.pret_daloa || null,
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

  const sectionClass = "bg-card/95 backdrop-blur-sm rounded-xl border border-border/60 shadow-sm p-5 sm:p-6 space-y-4";
  const labelClass = "text-sm font-semibold text-foreground";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Section 1: Identité */}
      <div className={sectionClass}>
        <h2 className="text-base font-bold text-primary flex items-center gap-2">
          <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">1</span>
          Vos coordonnées
        </h2>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="nom" className={labelClass}>Nom et prénom <span className="text-destructive">*</span></Label>
            <Input id="nom" value={form.nom} onChange={e => update("nom", e.target.value)} placeholder="Votre nom complet" required className="bg-background/80" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className={labelClass}>Zone de résidence <span className="text-destructive">*</span></Label>
              <Select value={form.zone} onValueChange={v => update("zone", v)}>
                <SelectTrigger className="bg-background/80"><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
                <SelectContent>
                  {ZONES.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ville" className={labelClass}>Ville</Label>
              <Input id="ville" value={form.ville} onChange={e => update("ville", e.target.value)} placeholder="Votre ville" className="bg-background/80" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="whatsapp" className={labelClass}>Numéro WhatsApp <span className="text-destructive">*</span></Label>
              <Input id="whatsapp" type="tel" value={form.whatsapp} onChange={e => update("whatsapp", e.target.value)} placeholder="+225 07 00 00 00 00" required className="bg-background/80" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className={labelClass}>Email <span className="text-destructive">*</span></Label>
              <Input id="email" type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="votre@email.com" required className="bg-background/80" />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Terre */}
      <div className={sectionClass}>
        <h2 className="text-base font-bold text-primary flex items-center gap-2">
          <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">2</span>
          Votre situation foncière
        </h2>
        <div className="space-y-3">
          <Label className={labelClass}>Possédez-vous déjà des terres agricoles ?</Label>
          <RadioGroup
            value={form.possede_terre === null ? "" : form.possede_terre ? "oui" : "non"}
            onValueChange={v => update("possede_terre", v === "oui")}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="oui" id="terre-oui" />
              <Label htmlFor="terre-oui" className="font-normal cursor-pointer">Oui</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="non" id="terre-non" />
              <Label htmlFor="terre-non" className="font-normal cursor-pointer">Non</Label>
            </div>
          </RadioGroup>

          {form.possede_terre === true && (
            <div className="space-y-1.5 pl-4 border-l-2 border-primary/30">
              <Label htmlFor="superficie_terre" className={labelClass}>Superficie approximative (hectares)</Label>
              <Input id="superficie_terre" type="number" min="0" step="0.5" value={form.superficie_terre} onChange={e => update("superficie_terre", e.target.value)} placeholder="Ex: 5" className="bg-background/80 max-w-[200px]" />
            </div>
          )}

          {form.possede_terre === false && (
            <div className="space-y-2 pl-4 border-l-2 border-primary/30">
              <Label className={labelClass}>Souhaiteriez-vous développer une plantation ?</Label>
              <RadioGroup value={form.souhait_plantation} onValueChange={v => update("souhait_plantation", v)}>
                {["Oui", "Peut-être", "Je souhaite simplement m'informer"].map(opt => (
                  <div key={opt} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt} id={`souhait-${opt}`} />
                    <Label htmlFor={`souhait-${opt}`} className="font-normal cursor-pointer">{opt}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Projet */}
      <div className={sectionClass}>
        <h2 className="text-base font-bold text-primary flex items-center gap-2">
          <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">3</span>
          Votre projet
        </h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className={labelClass}>Type de projet qui vous intéresse</Label>
            <div className="space-y-2">
              {PROJETS.map(p => (
                <div key={p} className="flex items-center space-x-2">
                  <Checkbox id={`projet-${p}`} checked={form.projet_interet.includes(p)} onCheckedChange={() => toggleMulti("projet_interet", p)} />
                  <Label htmlFor={`projet-${p}`} className="font-normal text-sm cursor-pointer">{p}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className={labelClass}>Superficie envisagée</Label>
              <Select value={form.superficie_souhaitee} onValueChange={v => update("superficie_souhaitee", v)}>
                <SelectTrigger className="bg-background/80"><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
                <SelectContent>
                  {SUPERFICIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>Délai envisagé</Label>
              <Select value={form.timing_projet} onValueChange={v => update("timing_projet", v)}>
                <SelectTrigger className="bg-background/80"><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
                <SelectContent>
                  {TIMINGS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className={labelClass}>Pourquoi développer une plantation ?</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MOTIVATIONS.map(m => (
                <div key={m} className="flex items-center space-x-2">
                  <Checkbox id={`motiv-${m}`} checked={form.motivation.includes(m)} onCheckedChange={() => toggleMulti("motivation", m)} />
                  <Label htmlFor={`motiv-${m}`} className="font-normal text-sm cursor-pointer">{m}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className={labelClass}>Niveau de projet envisagé</Label>
            <Select value={form.niveau_projet} onValueChange={v => update("niveau_projet", v)}>
              <SelectTrigger className="bg-background/80"><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
              <SelectContent>
                {NIVEAUX.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Section 4: Daloa + Source */}
      <div className={sectionClass}>
        <h2 className="text-base font-bold text-primary flex items-center gap-2">
          <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">4</span>
          Plantation à Daloa
        </h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className={labelClass}>
              Seriez-vous prêt(e) à lancer votre propre plantation de palmier à huile à Daloa, dans le cadre du programme structuré AgriCapital ?
            </Label>
            <RadioGroup value={form.pret_daloa} onValueChange={v => update("pret_daloa", v)}>
              {DALOA_OPTIONS.map(opt => (
                <div key={opt} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt} id={`daloa-${opt}`} />
                  <Label htmlFor={`daloa-${opt}`} className="font-normal text-sm cursor-pointer">{opt}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-1.5">
            <Label className={labelClass}>Comment avez-vous entendu parler d'AgriCapital ?</Label>
            <Select value={form.source} onValueChange={v => update("source", v)}>
              <SelectTrigger className="bg-background/80"><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
              <SelectContent>
                {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Submit */}
      <Button type="submit" disabled={loading} className="w-full text-base py-6 rounded-xl shadow-lg bg-primary hover:bg-primary/90 font-semibold tracking-wide">
        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ChevronRight className="mr-2 h-5 w-5" />}
        Rejoindre la liste d'attente
      </Button>

      <p className="text-xs text-muted-foreground text-center leading-relaxed">
        Les informations collectées sont confidentielles et utilisées uniquement pour vous informer des initiatives agricoles développées par AgriCapital.
      </p>
    </form>
  );
}
