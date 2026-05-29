import { createContext, useContext, useState } from 'react'
import uz from '../lang/uz'
import en from '../lang/en'

const LANGS = { uz, en }
const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'uz')

  const t = (key) => LANGS[lang]?.[key] ?? LANGS['uz']?.[key] ?? key

  const toggleLang = () => {
    const next = lang === 'uz' ? 'en' : 'uz'
    setLang(next)
    localStorage.setItem('lang', next)
  }

  return (
    <LangContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be inside LangProvider')
  return ctx
}
