import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as RNLocalize from 'react-native-localize'
import { useCallback, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import en from '../locales/en'

const locales = RNLocalize.getLocales()

const numberFormatSettings = RNLocalize.getNumberFormatSettings()
export const { decimalSeparator, groupingSeparator: groupSeparator } =
  numberFormatSettings

export const [currencyType] = RNLocalize.getCurrencies() || ['USD']
export const usesMetricSystem = RNLocalize.usesMetricSystem()

let phoneLang = 'en'
let phoneLocale = 'en-US'
if (Array.isArray(locales)) {
  phoneLang = locales[0].languageCode
  phoneLocale = locales[0].languageTag
}

export const locale = phoneLocale
export const lang = phoneLang

export const supportedLangs = [
  'en',
  // 'zh',
  // 'ja'
  // 'ko',
] as const

export type LangType = (typeof supportedLangs)[number]

export const SUPPORTED_LANGUAGUES = [
  { label: 'English', value: 'en' },
  // { label: '中文', value: 'zh' }, // chinese
  // { label: '日本人', value: 'ja' }, // japanese
  // { label: '한국어', value: 'ko' }, // korean
] as { label: string; value: LangType }[]

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
  },
  lng: phoneLang,
  fallbackLng: ['en'],
})

export const useLanguage = () => {
  const [language, setLanguage] = useState('en')

  const changeLanguage = useCallback(async (l: string) => {
    setLanguage(l)
    await AsyncStorage.setItem('language', l)
    await i18n.changeLanguage(l)
  }, [])

  const initLanguage = useCallback(async () => {
    const l = await AsyncStorage.getItem('language')
    if (l) {
      await changeLanguage(l)
    }
    setLanguage(l || phoneLang)
  }, [changeLanguage])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the saved language once at start
    initLanguage().catch((e) => console.error(e))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { language, changeLanguage }
}

export default i18n
