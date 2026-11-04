import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import hi from './hi.json';
import mr from './mr.json';
import ta from './ta.json';
import bn from './bn.json';

const getInitialLanguage = (): string => {
  const saved = localStorage.getItem('thermagrid_lang');
  if (saved && ['en', 'hi', 'mr', 'ta', 'bn'].includes(saved)) {
    return saved;
  }
  const browserLang = typeof navigator !== 'undefined' ? navigator.language?.split('-')[0] : 'en';
  if (browserLang && ['hi', 'mr', 'ta', 'bn'].includes(browserLang)) {
    return browserLang;
  }
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      mr: { translation: mr },
      ta: { translation: ta },
      bn: { translation: bn },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem('thermagrid_lang', lng);
  } catch (e) {
    // pass
  }
});

export default i18n;
