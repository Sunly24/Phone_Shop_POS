import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { setupGlobalLanguage } from './Utils/langStyles.js';

// Translation files
import enTranslation from '../translations/en/global.json';
import khTranslation from '../translations/kh/global.json';
import zhTranslation from '../translations/zh/global.json';

const resources = {
  en: {
    translation: enTranslation
  },
  kh: {
    translation: khTranslation
  },
  zh: {
    translation: zhTranslation
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en', // Default language
    fallbackLng: 'en',
    
    interpolation: {
      escapeValue: false // React already does escaping
    },
  });

// Set up initial language
setupGlobalLanguage(i18n.language);

// Handle language changes
i18n.on('languageChanged', (lng) => {
  setupGlobalLanguage(lng);
});

export default i18n;
