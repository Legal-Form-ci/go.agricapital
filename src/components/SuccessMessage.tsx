import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2 } from "lucide-react";
import logoAgricapital from "@/assets/logo-agricapital.png";

export default function SuccessMessage() {
  const formUrl = "https://go.agricapital.ci";

  return (
    <div className="text-center space-y-8">
      <div className="bg-card rounded-lg border p-8 space-y-4">
        <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
        <h2 className="text-2xl font-bold text-foreground">Merci pour votre inscription.</h2>
        <p className="text-foreground/80 leading-relaxed">
          Vous faites désormais partie des premières personnes informées des initiatives agricoles actuellement en préparation chez AgriCapital.
        </p>
        <p className="text-foreground/80 leading-relaxed">
          Nous reviendrons vers vous prochainement pour partager les prochaines informations.
        </p>
      </div>

      <div className="bg-card rounded-lg border p-8 space-y-4">
        <p className="text-sm font-medium text-muted-foreground">
          Scannez ce code pour rejoindre la liste d'attente.
        </p>
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-lg inline-block">
            <QRCodeSVG
              value={formUrl}
              size={200}
              level="H"
              includeMargin
              imageSettings={{
                src: logoAgricapital,
                height: 40,
                width: 40,
                excavate: true,
              }}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Lien également disponible dans la description.
        </p>
      </div>
    </div>
  );
}
