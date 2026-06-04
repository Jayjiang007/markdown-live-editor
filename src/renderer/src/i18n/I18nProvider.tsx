import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import en from './en.json'
import zh from './zh.json'

export type Locale = 'en' | 'zh'

export type I18nStrings = typeof en

const strings: Record<Locale, I18nStrings> = { en, zh }

interface I18nContext {
  locale: Locale
  t: (key: string, vars?: Record<string, string | number>) => string
  setLocale: (value: Locale) => void
}

const Ctx = createContext<I18nContext>({
  locale: 'en',
  t: (key) => key,
  setLocale: () => {}
})

export function useI18n(): I18nContext {
  return useContext(Ctx)
}

interface Props {
  initialLocale: Locale
  onLocaleChange: (value: Locale) => void
  children: ReactNode
}

export function I18nProvider({ initialLocale, onLocaleChange, children }: Props): JSX.Element {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  useEffect(() => {
    setLocaleState(initialLocale)
  }, [initialLocale])

  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
  }, [locale])

  const setLocale = (value: Locale): void => {
    setLocaleState(value)
    onLocaleChange(value)
  }

  const t = (key: string, vars?: Record<string, string | number>): string => {
    let value = (strings[locale] as Record<string, string>)[key]
    if (value === undefined) {
      value = (strings.en as Record<string, string>)[key] ?? key
    }

    if (vars) {
      for (const [name, variable] of Object.entries(vars)) {
        value = value.replace(`{${name}}`, String(variable))
      }
    }

    return value
  }

  return <Ctx.Provider value={{ locale, t, setLocale }}>{children}</Ctx.Provider>
}
