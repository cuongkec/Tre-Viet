import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'vi' | 'en';

type Translations = {
  [key in Language]: {
    [key: string]: string;
  };
};

const translations: Translations = {
  vi: {
    'nav.collections': 'Bộ Sưu Tập',
    'nav.about': 'Về Chúng Tôi',
    'nav.process': 'Quy Trình',
    'nav.contact': 'Liên Hệ',
    'search.placeholder': 'Tìm kiếm...',
    'hero.title': 'Tinh Hoa Nội Thất Tre',
  },
  en: {
    'nav.collections': 'Collections',
    'nav.about': 'About Us',
    'nav.process': 'Process',
    'nav.contact': 'Contact Us',
    'search.placeholder': 'Search...',
    'hero.title': 'The Essence of Bamboo Furniture',
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'vi';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
