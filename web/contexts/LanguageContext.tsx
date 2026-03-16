'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UILanguage, LANGUAGE_KEY } from '@/lib/constants';

interface LanguageContextType {
  language: UILanguage;
  setLanguage: (lang: UILanguage) => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'french',
  setLanguage: () => {},
  isRTL: false,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<UILanguage>('french');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LANGUAGE_KEY) as UILanguage | null;
      if (saved && ['french', 'arabic', 'derja'].includes(saved)) {
        setLanguageState(saved);
      }
    }
  }, []);

  const setLanguage = (lang: UILanguage) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_KEY, lang);
      // Dispatch storage event for other components
      window.dispatchEvent(new Event('storage'));
    }
  };

  const isRTL = language === 'arabic' || language === 'derja';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
