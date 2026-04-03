import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoAgricapital from "@/assets/logo-agricapital.png";

interface SuccessMessageProps {
  userName: string;
}

function buildWhatsAppUrl(name: string) {
  const message = `Bonjour, je suis ${name}. J'ai rejoint la liste d'attente AgriCapital et je souhaiterais échanger davantage sur les projets de plantation de palmier à huile à Daloa. Merci.`;
  return `https://wa.me/2250564551717?text=${encodeURIComponent(message)}`;
}

export default function SuccessMessage({ userName }: SuccessMessageProps) {
  const whatsappUrl = buildWhatsAppUrl(userName);

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
          Scannez ce code pour nous contacter directement sur WhatsApp
        </p>
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-lg inline-block">
            <QRCodeSVG
              value={whatsappUrl}
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
          Ou cliquez directement sur le bouton ci-dessous
        </p>
        <Button asChild className="bg-[#25D366] hover:bg-[#1da851] text-white font-semibold">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="mr-2 h-5 w-5" />
            Contacter AgriCapital sur WhatsApp
          </a>
        </Button>
      </div>
    </div>
  );
}
