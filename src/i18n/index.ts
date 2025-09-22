import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import thCommon from './locales/th/common.json';
import enCommon from './locales/en/common.json';
import thAuth from './locales/th/auth.json';
import enAuth from './locales/en/auth.json';
import thNavigation from './locales/th/navigation.json';
import enNavigation from './locales/en/navigation.json';
import thDashboard from './locales/th/dashboard.json';
import enDashboard from './locales/en/dashboard.json';
import thApplication from './locales/th/application.json';
import enApplication from './locales/en/application.json';
import thPayment from './locales/th/payment.json';
import enPayment from './locales/en/payment.json';
import thCertificate from './locales/th/certificate.json';
import enCertificate from './locales/en/certificate.json';

const resources = {
  th: {
    common: thCommon,
    auth: thAuth,
    navigation: thNavigation,
    dashboard: thDashboard,
    application: thApplication,
    payment: thPayment,
    certificate: thCertificate,
  },
  en: {
    common: enCommon,
    auth: enAuth,
    navigation: enNavigation,
    dashboard: enDashboard,
    application: enApplication,
    payment: enPayment,
    certificate: enCertificate,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'th',
    lng: 'th', // Default to Thai
    debug: false,
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },

    ns: ['common', 'auth', 'navigation', 'dashboard', 'application', 'payment', 'certificate'],
    defaultNS: 'common',
  });

export default i18n;