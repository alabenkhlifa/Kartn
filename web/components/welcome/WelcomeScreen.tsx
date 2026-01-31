'use client';

import { useState, useEffect } from 'react';
import { Car, HelpCircle, Scale, Zap, Star, ShoppingBag } from 'lucide-react';
import { LANGUAGE_KEY, UILanguage } from '@/lib/constants';

interface FAQItem {
  icon: React.ReactNode;
  title: Record<UILanguage, string>;
  description: Record<UILanguage, string>;
  message: string;
}

interface WelcomeScreenProps {
  onFAQClick: (message: string, language?: UILanguage) => void;
}

const faqItems: FAQItem[] = [
  {
    icon: <Car className="w-5 h-5" />,
    title: {
      french: 'Acheter une voiture',
      arabic: 'شراء سيارة',
      derja: 'تشري كرهبة',
    },
    description: {
      french: 'Trouvez la voiture idéale',
      arabic: 'لقى الكرهبة المثالية',
      derja: 'لقى الكرهبة اللي تناسبك',
    },
    message: '1',
  },
  {
    icon: <HelpCircle className="w-5 h-5" />,
    title: {
      french: 'Procédures FCR',
      arabic: 'إجراءات FCR',
      derja: 'إجراءات FCR',
    },
    description: {
      french: 'Guide des démarches',
      arabic: 'دليل الإجراءات',
      derja: 'دليل الإجراءات',
    },
    message: '2',
  },
  {
    icon: <Scale className="w-5 h-5" />,
    title: {
      french: 'Comparer des voitures',
      arabic: 'مقارنة السيارات',
      derja: 'تقارن كراهب',
    },
    description: {
      french: 'Comparez deux modèles',
      arabic: 'قارن بين موديلين',
      derja: 'قارن بين زوز موديلات',
    },
    message: '3',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: {
      french: 'Véhicules électriques',
      arabic: 'السيارات الكهربائية',
      derja: 'الكراهب الكهربائية',
    },
    description: {
      french: 'Infos EV et hybrides',
      arabic: 'معلومات عن الكهربائية',
      derja: 'معلومات على الكهربائية',
    },
    message: '4',
  },
  {
    icon: <ShoppingBag className="w-5 h-5" />,
    title: {
      french: 'Parcourir les offres',
      arabic: 'تصفح العروض',
      derja: 'تشوف العروض',
    },
    description: {
      french: 'Voir toutes les voitures',
      arabic: 'شوف كل السيارات',
      derja: 'شوف الكراهب الكل',
    },
    message: '5',
  },
  {
    icon: <Star className="w-5 h-5" />,
    title: {
      french: 'Voitures populaires',
      arabic: 'السيارات الشعبية',
      derja: 'الكراهب الشعبية',
    },
    description: {
      french: 'Véhicules subventionnés',
      arabic: 'السيارات المدعومة',
      derja: 'الكراهب المدعومة',
    },
    message: '6',
  },
];

const languageOptions: { code: UILanguage; label: string; nativeLabel: string; flag: string }[] = [
  { code: 'french', label: 'French', nativeLabel: 'Français', flag: '🇫🇷' },
  { code: 'arabic', label: 'Arabic', nativeLabel: 'العربية', flag: '🇸🇦' },
  { code: 'derja', label: 'Tunisian', nativeLabel: 'تونسي', flag: '🇹🇳' },
];

export default function WelcomeScreen({ onFAQClick }: WelcomeScreenProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<UILanguage>('french');
  const [languageSelected, setLanguageSelected] = useState(false);

  // Load saved language on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LANGUAGE_KEY) as UILanguage | null;
      if (saved && ['french', 'arabic', 'derja'].includes(saved)) {
        setSelectedLanguage(saved);
        setLanguageSelected(true);
      }
    }
  }, []);

  const handleLanguageSelect = (lang: UILanguage) => {
    setSelectedLanguage(lang);
    setLanguageSelected(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_KEY, lang);
    }
  };

  const handleFAQClick = (item: FAQItem) => {
    // Send the full localized text instead of just the number
    onFAQClick(item.title[selectedLanguage], selectedLanguage);
  };

  const isRTL = selectedLanguage === 'arabic' || selectedLanguage === 'derja';

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Car Icon */}
      <div className="w-16 h-16 rounded-full bg-accent-light flex items-center justify-center mb-4">
        <Car className="w-8 h-8 text-accent" />
      </div>

      {/* Bilingual Welcome Text */}
      <h2 className="text-xl font-semibold text-text-primary mb-2 text-center">
        Bienvenue sur KarTN | مرحبا بيك في KarTN
      </h2>

      {/* Bilingual Description - always shown */}
      <div className="text-center mb-6 max-w-sm">
        <p className="text-text-secondary text-sm">
          Votre assistant intelligent pour l&apos;importation automobile en Tunisie
        </p>
        <p className="text-text-secondary text-sm" dir="rtl">
          مساعدك الذكي لاستيراد السيارات في تونس
        </p>
      </div>

      {/* Language Selection */}
      {!languageSelected && (
        <div className="w-full max-w-sm mb-6">
          <p className="text-sm text-text-secondary text-center mb-3 font-medium">
            Choisir la langue | اختار اللغة
          </p>
          <div className="flex gap-2 justify-center">
            {languageOptions.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2
                  ${selectedLanguage === lang.code
                    ? 'border-accent bg-accent text-white'
                    : 'border-white/10 bg-bg-secondary hover:border-accent/30 hover:bg-bg-elevated text-text-primary'
                  }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.nativeLabel}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Language indicator when already selected */}
      {languageSelected && (
        <button
          onClick={() => setLanguageSelected(false)}
          className="text-xs text-text-secondary mb-4 hover:text-accent transition-colors flex items-center gap-1"
        >
          <span>{languageOptions.find(l => l.code === selectedLanguage)?.flag}</span>
          <span>{languageOptions.find(l => l.code === selectedLanguage)?.nativeLabel}</span>
          <span>▼</span>
        </button>
      )}

      {/* FAQ Section - show after language selection */}
      {languageSelected && (
        <>

          <div className="w-full max-w-sm">
            <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3 text-center">
              {selectedLanguage === 'french' && 'Comment puis-je vous aider?'}
              {selectedLanguage === 'arabic' && 'كيف نقدر نساعدك؟'}
              {selectedLanguage === 'derja' && 'كيفاش نعاونك؟'}
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {faqItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleFAQClick(item)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-bg-secondary
                           border border-white/10 hover:border-accent/30 hover:bg-bg-elevated
                           transition-all text-center group"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent-light
                                flex items-center justify-center text-accent
                                group-hover:bg-accent group-hover:text-white transition-colors">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {item.title[selectedLanguage]}
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      {item.description[selectedLanguage]}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Bottom prompt */}
          <p className="text-xs text-text-secondary mt-6 text-center">
            {selectedLanguage === 'french' && "Posez n'importe quelle question"}
            {selectedLanguage === 'arabic' && 'اسأل أي سؤال تحب'}
            {selectedLanguage === 'derja' && 'اسأل أي سؤال تحب'}
          </p>
        </>
      )}
    </div>
  );
}
