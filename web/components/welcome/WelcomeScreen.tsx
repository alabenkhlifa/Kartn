'use client';

import { Car, Calculator, HelpCircle } from 'lucide-react';

interface FAQItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  message: string;
}

interface WelcomeScreenProps {
  onFAQClick: (message: string) => void;
}

const faqItems: FAQItem[] = [
  {
    icon: <Car className="w-5 h-5" />,
    title: 'Acheter une voiture',
    description: 'Vous cherchez à acheter une voiture ?',
    message: 'Je cherche à acheter une voiture',
  },
  {
    icon: <Calculator className="w-5 h-5" />,
    title: 'Calculer les coûts',
    description: "Vous voulez calculer les coûts d'importation ?",
    message: "Je veux calculer les coûts d'importation",
  },
  {
    icon: <HelpCircle className="w-5 h-5" />,
    title: 'Questions sur les procédures',
    description: 'Vous avez des questions sur les procédures ?',
    message: "J'ai des questions sur les procédures",
  },
];

export default function WelcomeScreen({ onFAQClick }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
      {/* Car Icon */}
      <div className="w-16 h-16 rounded-full bg-accent-light flex items-center justify-center mb-4">
        <Car className="w-8 h-8 text-accent" />
      </div>

      {/* Welcome Text */}
      <h2 className="text-xl font-semibold text-text-primary mb-2">
        Bienvenue sur KarTN
      </h2>
      <p className="text-text-secondary text-center mb-8 max-w-sm">
        Votre assistant intelligent pour l&apos;importation automobile en Tunisie
      </p>

      {/* FAQ Section */}
      <div className="w-full max-w-sm">
        <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3 text-center">
          Questions frequentes
        </h3>

        <div className="space-y-2">
          {faqItems.map((item, index) => (
            <button
              key={index}
              onClick={() => onFAQClick(item.message)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-bg-secondary
                       border border-white/10 hover:border-accent/30 hover:bg-bg-elevated
                       transition-all text-left group"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent-light
                            flex items-center justify-center text-accent
                            group-hover:bg-accent group-hover:text-white transition-colors">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {item.title}
                </p>
                <p className="text-xs text-text-secondary truncate">
                  {item.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom prompt */}
      <p className="text-xs text-text-secondary mt-8 text-center">
        Posez n&apos;importe quelle question sur l&apos;importation automobile
      </p>
    </div>
  );
}
