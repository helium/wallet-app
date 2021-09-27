import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as RNLocalize from 'react-native-localize'
import en from '../locales/en'

const locales = RNLocalize.getLocales()

let phoneLang = 'en'
if (Array.isArray(locales)) {
  phoneLang = locales[0].languageCode
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
  },
  lng: phoneLang,
  fallbackLng: ['en'],
})

export default i18n
