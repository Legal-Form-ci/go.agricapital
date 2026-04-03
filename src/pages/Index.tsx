import { useState } from "react";
import WaitlistForm from "@/components/WaitlistForm";
import SuccessMessage from "@/components/SuccessMessage";
import heroAgricapital from "@/assets/hero-agricapital.png";
import palmBg from "@/assets/palm-background.jpg";

const Index = () => {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Palm background */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${palmBg})` }}
      />
      <div className="fixed inset-0 bg-white/50" />
      <div className="fixed inset-0 bg-gradient-to-b from-green-950/60 via-white/30 to-white/40" />

      <div className="relative z-10 w-full max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-10">
        {/* Hero image */}
        <div className="text-center mb-4 sm:mb-6">
          <img
            src={heroAgricapital}
            alt="AgriCapital — Devenez planteur de palmier à huile"
            className="w-full max-w-full sm:max-w-lg mx-auto rounded-xl shadow-2xl mb-4 sm:mb-5 object-contain"
          />
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1.5 sm:mb-2 leading-tight drop-shadow-sm px-1">
            Liste d'attente — Projets agricoles AgriCapital
          </h1>
          <p className="text-xs sm:text-sm text-foreground/80 font-medium">Daloa, Côte d'Ivoire · Palmier à huile</p>
        </div>

        {!submitted ? (
          <>
            {/* Presentation */}
            <div className="bg-card/95 backdrop-blur-sm rounded-xl border border-border/60 shadow-lg p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 text-sm sm:text-base leading-relaxed text-foreground/90">
              <p className="mb-3 sm:mb-4 text-sm sm:text-base md:text-lg font-medium text-foreground">
                Vous envisagez de développer une activité agricole sérieuse et durable.
              </p>
              <p className="mb-3 sm:mb-4">
                Que ce soit pour sécuriser votre patrimoine, préparer votre retraite, diversifier vos revenus ou construire un actif transmissible à votre famille, l'agriculture représente aujourd'hui une opportunité stratégique à fort potentiel.
              </p>
              <p className="mb-2 sm:mb-3 font-semibold text-foreground">Mais réussir un projet agricole ne s'improvise pas.</p>
              <ul className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                {[
                  "Accès sécurisé à la terre",
                  "Choix d'une zone réellement productive",
                  "Partenaires fiables",
                  "Encadrement technique rigoureux",
                  "Gestion professionnelle sur le long terme"
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mb-3 sm:mb-4">
                C'est précisément sur ces fondations qu'<strong>AgriCapital</strong> construit sa nouvelle approche : structurer, sécuriser et professionnaliser le développement de plantations agricoles durables.
              </p>
              <p className="mb-3 sm:mb-4">
                Nous lançons actuellement une première phase centrée sur <strong>le développement de plantations de palmier à huile</strong>, avec une implantation initiale dans la zone stratégique de <strong>Daloa</strong>.
              </p>
              <p className="text-primary font-medium">
                Si vous souhaitez être informé en priorité et étudier votre positionnement dans ce projet, rejoignez la liste d'attente.
              </p>
            </div>

            {/* Form */}
            <WaitlistForm onSuccess={() => setSubmitted(true)} />
          </>
        ) : (
          <SuccessMessage />
        )}

        {/* Footer */}
        <div className="mt-6 sm:mt-8 bg-white/80 backdrop-blur-sm rounded-lg px-3 sm:px-4 py-3">
          <p className="text-center text-xs text-foreground/70">
            © {new Date().getFullYear()} AgriCapital · Investir la terre. Cultiver l'avenir.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
