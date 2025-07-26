import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enTranslations from '@/locales/en.json'
import jaTranslations from '@/locales/ja.json'
import koTranslations from '@/locales/ko.json'
import zhTranslations from '@/locales/zh.json'
import esTranslations from '@/locales/es.json'
import ptTranslations from '@/locales/pt.json'
import nlTranslations from '@/locales/nl.json'
import ukTranslations from '@/locales/uk.json'
import fiTranslations from '@/locales/fi.json'
import zhTwTranslations from '@/locales/zh-tw.json'

// Get saved language from localStorage or default to 'en'
const savedLanguage = localStorage.getItem('i18nextLng') || 'en'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations
      },
      ja: {
        translation: jaTranslations
      },
      ko: {
        translation: koTranslations
      },
      zh: {
        translation: zhTranslations
      },
      es: {
        translation: esTranslations
      },
      pt: {
        translation: ptTranslations
      },
      nl: {
        translation: nlTranslations
      },
      uk: {
        translation: ukTranslations
      },
      fi: {
        translation: fiTranslations
      },
      'zh-TW': {
        translation: zhTwTranslations
      }
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  })

export default i18n