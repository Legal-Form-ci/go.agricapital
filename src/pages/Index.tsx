import { useState } from "react";
import WaitlistForm from "@/components/WaitlistForm";
import SuccessMessage from "@/components/SuccessMessage";
import logoAgricapital from "@/assets/logo-agricapital.png";

const Index = () => {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src={logoAgricapital}
            alt="AgriCapital"
            className="h-20 sm:h-24 mx-auto mb-6"
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Liste d'attente — Projets agricoles AgriCapital
          </h1>
        </div>

        {!submitted ? (
          <>
            {/* Presentation */}
            <div className="bg-card rounded-lg border p-6 mb-8 text-sm sm:text-base leading-relaxed text-foreground/90">
              <p className="mb-4">
                Aujourd'hui, de nombreux professionnels, fonctionnaires, membres de la diaspora, commerçants et entrepreneurs souhaitent développer une activité agricole durable.
              </p>
              <p className="mb-3">Pour beaucoup, posséder une plantation représente :</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>une manière de sécuriser un patrimoine</li>
                <li>préparer une retraite plus sereine</li>
                <li>diversifier leurs activités</li>
                <li>transmettre un actif productif à leur famille.</li>
              </ul>
              <p className="mb-3">Cependant, dans la pratique, plusieurs difficultés se posent :</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>accès sécurisé à la terre</li>
                <li>identification de partenaires sérieux et fiables</li>
                <li>mise en place d'une gestion agricole professionnelle</li>
                <li>suivi technique sur le long terme.</li>
              </ul>
              <p className="mb-4">
                AgriCapital travaille actuellement sur une nouvelle approche destinée à faciliter la création et le développement de plantations agricoles durables.
              </p>
              <p className="mb-4">
                Dans un premier temps, les projets étudiés concernent principalement <strong>le développement de plantations de palmier à huile</strong>, tout en restant ouverts à d'autres cultures pérennes dans le futur.
              </p>
              <p>
                Si ce sujet vous intéresse, vous pouvez rejoindre la liste d'attente afin d'être informé en priorité des prochaines étapes.
              </p>
            </div>

            {/* Form */}
            <WaitlistForm onSuccess={() => setSubmitted(true)} />
          </>
        ) : (
          <SuccessMessage />
        )}
      </div>
    </div>
  );
};

export default Index;
