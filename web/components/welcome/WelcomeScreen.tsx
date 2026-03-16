'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
      arabic: '\u0634\u0631\u0627\u0621 \u0633\u064a\u0627\u0631\u0629',
      derja: '\u062a\u0634\u0631\u064a \u0643\u0631\u0647\u0628\u0629',
    },
    description: {
      french: 'Trouvez la voiture id\u00e9ale',
      arabic: '\u0644\u0642\u0649 \u0627\u0644\u0643\u0631\u0647\u0628\u0629 \u0627\u0644\u0645\u062b\u0627\u0644\u064a\u0629',
      derja: '\u0644\u0642\u0649 \u0627\u0644\u0643\u0631\u0647\u0628\u0629 \u0627\u0644\u0644\u064a \u062a\u0646\u0627\u0633\u0628\u0643',
    },
    message: '1',
  },
  {
    icon: <HelpCircle className="w-5 h-5" />,
    title: {
      french: 'Proc\u00e9dures FCR',
      arabic: '\u0625\u062c\u0631\u0627\u0621\u0627\u062a FCR',
      derja: '\u0625\u062c\u0631\u0627\u0621\u0627\u062a FCR',
    },
    description: {
      french: 'Guide des d\u00e9marches',
      arabic: '\u062f\u0644\u064a\u0644 \u0627\u0644\u0625\u062c\u0631\u0627\u0621\u0627\u062a',
      derja: '\u062f\u0644\u064a\u0644 \u0627\u0644\u0625\u062c\u0631\u0627\u0621\u0627\u062a',
    },
    message: '2',
  },
  {
    icon: <Scale className="w-5 h-5" />,
    title: {
      french: 'Comparer des voitures',
      arabic: '\u0645\u0642\u0627\u0631\u0646\u0629 \u0627\u0644\u0633\u064a\u0627\u0631\u0627\u062a',
      derja: '\u062a\u0642\u0627\u0631\u0646 \u0643\u0631\u0627\u0647\u0628',
    },
    description: {
      french: 'Comparez deux mod\u00e8les',
      arabic: '\u0642\u0627\u0631\u0646 \u0628\u064a\u0646 \u0645\u0648\u062f\u064a\u0644\u064a\u0646',
      derja: '\u0642\u0627\u0631\u0646 \u0628\u064a\u0646 \u0632\u0648\u0632 \u0645\u0648\u062f\u064a\u0644\u0627\u062a',
    },
    message: '3',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: {
      french: 'V\u00e9hicules \u00e9lectriques',
      arabic: '\u0627\u0644\u0633\u064a\u0627\u0631\u0627\u062a \u0627\u0644\u0643\u0647\u0631\u0628\u0627\u0626\u064a\u0629',
      derja: '\u0627\u0644\u0643\u0631\u0627\u0647\u0628 \u0627\u0644\u0643\u0647\u0631\u0628\u0627\u0626\u064a\u0629',
    },
    description: {
      french: 'Infos EV et hybrides',
      arabic: '\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0639\u0646 \u0627\u0644\u0643\u0647\u0631\u0628\u0627\u0626\u064a\u0629',
      derja: '\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0639\u0644\u0649 \u0627\u0644\u0643\u0647\u0631\u0628\u0627\u0626\u064a\u0629',
    },
    message: '4',
  },
  {
    icon: <ShoppingBag className="w-5 h-5" />,
    title: {
      french: 'Parcourir les offres',
      arabic: '\u062a\u0635\u0641\u062d \u0627\u0644\u0639\u0631\u0648\u0636',
      derja: '\u062a\u0634\u0648\u0641 \u0627\u0644\u0639\u0631\u0648\u0636',
    },
    description: {
      french: 'Voir toutes les voitures',
      arabic: '\u0634\u0648\u0641 \u0643\u0644 \u0627\u0644\u0633\u064a\u0627\u0631\u0627\u062a',
      derja: '\u0634\u0648\u0641 \u0627\u0644\u0643\u0631\u0627\u0647\u0628 \u0627\u0644\u0643\u0644',
    },
    message: '5',
  },
  {
    icon: <Star className="w-5 h-5" />,
    title: {
      french: 'Voitures populaires',
      arabic: '\u0627\u0644\u0633\u064a\u0627\u0631\u0627\u062a \u0627\u0644\u0634\u0639\u0628\u064a\u0629',
      derja: '\u0627\u0644\u0643\u0631\u0627\u0647\u0628 \u0627\u0644\u0634\u0639\u0628\u064a\u0629',
    },
    description: {
      french: 'V\u00e9hicules subventionn\u00e9s',
      arabic: '\u0627\u0644\u0633\u064a\u0627\u0631\u0627\u062a \u0627\u0644\u0645\u062f\u0639\u0648\u0645\u0629',
      derja: '\u0627\u0644\u0643\u0631\u0627\u0647\u0628 \u0627\u0644\u0645\u062f\u0639\u0648\u0645\u0629',
    },
    message: '6',
  },
];

const languageOptions: { code: UILanguage; label: string; nativeLabel: string; flag: string }[] = [
  { code: 'french', label: 'French', nativeLabel: 'Fran\u00e7ais', flag: '\ud83c\uddeb\ud83c\uddf7' },
  { code: 'arabic', label: 'Arabic', nativeLabel: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629', flag: '\ud83c\uddf8\ud83c\udde6' },
  { code: 'derja', label: 'Tunisian', nativeLabel: '\u062a\u0648\u0646\u0633\u064a', flag: '\ud83c\uddf9\ud83c\uddf3' },
];

const faqContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const faqItemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

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
      {/* Animated K Logo */}
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-[#1A6FD4] flex items-center justify-center mb-4 k-logo-pulse">
        <span className="text-2xl font-bold text-white">K</span>
      </div>

      {/* Bilingual Welcome Text */}
      <h2 className="text-xl font-semibold text-text-primary mb-2 text-center">
        Bienvenue sur KarTN | \u0645\u0631\u062d\u0628\u0627 \u0628\u064a\u0643 \u0641\u064a KarTN
      </h2>

      {/* Bilingual Description - always shown */}
      <div className="text-center mb-6 max-w-sm">
        <p className="text-text-secondary text-sm">
          Votre assistant intelligent pour l&apos;importation automobile en Tunisie
        </p>
        <p className="text-text-secondary text-sm" dir="rtl">
          \u0645\u0633\u0627\u0639\u062f\u0643 \u0627\u0644\u0630\u0643\u064a \u0644\u0627\u0633\u062a\u064a\u0631\u0627\u062f \u0627\u0644\u0633\u064a\u0627\u0631\u0627\u062a \u0641\u064a \u062a\u0648\u0646\u0633
        </p>
      </div>

      {/* Language Selection */}
      <AnimatePresence mode="wait">
        {!languageSelected && (
          <motion.div
            key="language-selector"
            className="w-full max-w-sm mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <p className="text-sm text-text-secondary text-center mb-3 font-medium">
              Choisir la langue | \u0627\u062e\u062a\u0627\u0631 \u0627\u0644\u0644\u063a\u0629
            </p>
            <div className="flex gap-2 justify-center relative bg-[var(--bg-secondary)] rounded-full p-1 border border-[var(--border-subtle)]">
              {languageOptions.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`relative px-4 py-2.5 rounded-full transition-colors flex items-center gap-2 z-10
                    ${selectedLanguage === lang.code
                      ? 'text-white'
                      : 'text-text-secondary hover:text-text-primary'
                    }`}
                >
                  {selectedLanguage === lang.code && (
                    <motion.div
                      layoutId="language-pill"
                      className="absolute inset-0 bg-gradient-to-r from-accent to-[#1A6FD4] rounded-full"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10">{lang.flag}</span>
                  <span className="relative z-10 text-sm font-medium">{lang.nativeLabel}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Language indicator when already selected */}
      {languageSelected && (
        <button
          onClick={() => setLanguageSelected(false)}
          className="text-xs text-text-secondary mb-4 hover:text-accent transition-colors flex items-center gap-1"
        >
          <span>{languageOptions.find(l => l.code === selectedLanguage)?.flag}</span>
          <span>{languageOptions.find(l => l.code === selectedLanguage)?.nativeLabel}</span>
          <span className="text-[10px]">\u25bc</span>
        </button>
      )}

      {/* FAQ Section - show after language selection */}
      <AnimatePresence mode="wait">
        {languageSelected && (
          <motion.div
            key="faq-section"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-full max-w-sm">
              <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3 text-center">
                {selectedLanguage === 'french' && 'Comment puis-je vous aider?'}
                {selectedLanguage === 'arabic' && '\u0643\u064a\u0641 \u0646\u0642\u062f\u0631 \u0646\u0633\u0627\u0639\u062f\u0643\u061f'}
                {selectedLanguage === 'derja' && '\u0643\u064a\u0641\u0627\u0634 \u0646\u0639\u0627\u0648\u0646\u0643\u061f'}
              </h3>

              <motion.div
                className="grid grid-cols-2 gap-2"
                variants={faqContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {faqItems.map((item, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleFAQClick(item)}
                    variants={faqItemVariants}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[var(--bg-secondary)]
                             border border-[var(--border-subtle)] hover:border-accent/40
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
                  </motion.button>
                ))}
              </motion.div>
            </div>

            {/* Bottom prompt */}
            <p className="text-xs text-text-secondary mt-6 text-center">
              {selectedLanguage === 'french' && "Posez n'importe quelle question"}
              {selectedLanguage === 'arabic' && '\u0627\u0633\u0623\u0644 \u0623\u064a \u0633\u0624\u0627\u0644 \u062a\u062d\u0628'}
              {selectedLanguage === 'derja' && '\u0627\u0633\u0623\u0644 \u0623\u064a \u0633\u0624\u0627\u0644 \u062a\u062d\u0628'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
