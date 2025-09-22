import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import thTranslation from './locales/th.json';
import enTranslation from './locales/en.json';
import zhCnTranslation from './locales/zh-cn.json';
import zhTwTranslation from './locales/zh-tw.json';
import idTranslation from './locales/id.json';
import jaTranslation from './locales/ja.json';
import koTranslation from './locales/ko.json';

const resources = {
  th: { translation: thTranslation },
  en: { translation: enTranslation },
  'zh-CN': { translation: zhCnTranslation },
  'zh-TW': { translation: zhTwTranslation },
  id: { translation: idTranslation },
  ja: { translation: jaTranslation },
  ko: { translation: koTranslation }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'th', // Default to Thai for GACP platform
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    
    // Namespace and key separator
    keySeparator: '.',
    nsSeparator: ':',
  });

export default i18n;