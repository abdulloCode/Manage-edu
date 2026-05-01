import { createContext, useContext, useEffect, useState } from 'react'

// Text themes (eski)
const TEXT_THEMES = ['light', 'dark', 'corporate', 'business', 'cupcake', 'dracula']

// Color themes (yangi - 10 ta rang mavzusi)
const COLOR_THEMES = [
  {
    id: 'default',
    name: 'Default',
    primary: '#2563EB',
    secondary: '#3B82F6',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#1E293B',
    border: '#E2E8F0'
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    primary: '#0EA5E9',
    secondary: '#38BDF8',
    background: '#F0F9FF',
    surface: '#FFFFFF',
    text: '#1E3A8A',
    border: '#BAE6FD'
  },
  {
    id: 'forest',
    name: 'Forest Green',
    primary: '#10B981',
    secondary: '#34D399',
    background: '#ECFDF5',
    surface: '#FFFFFF',
    text: '#064E3B',
    border: '#A7F3D0'
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    primary: '#F59E0B',
    secondary: '#FBBF24',
    background: '#FFFBEB',
    surface: '#FFFFFF',
    text: '#92400E',
    border: '#FCD34D'
  },
  {
    id: 'rose',
    name: 'Rose Pink',
    primary: '#E11D48',
    secondary: '#F43F5E',
    background: '#FFF1F2',
    surface: '#FFFFFF',
    text: '#881337',
    border: '#FDA4AF'
  },
  {
    id: 'violet',
    name: 'Violet Purple',
    primary: '#8B5CF6',
    secondary: '#A78BFA',
    background: '#F5F3FF',
    surface: '#FFFFFF',
    text: '#5B21B6',
    border: '#C4B5FD'
  },
  {
    id: 'midnight',
    name: 'Midnight Dark',
    primary: '#1E1E2E',
    secondary: '#2D2D3D',
    background: '#181825',
    surface: '#252536',
    text: '#E5E7EB',
    border: '#404058'
  },
  {
    id: 'emerald',
    name: 'Emerald Teal',
    primary: '#059669',
    secondary: '#10B981',
    background: '#ECFDF5',
    surface: '#FFFFFF',
    text: '#064E3B',
    border: '#6EE7B7'
  },
  {
    id: 'ruby',
    name: 'Ruby Red',
    primary: '#DC2626',
    secondary: '#EF4444',
    background: '#FEF2F2',
    surface: '#FFFFFF',
    text: '#7F1D1D',
    border: '#FCA5A5'
  },
  {
    id: 'amber',
    name: 'Amber Gold',
    primary: '#D97706',
    secondary: '#F59E0B',
    background: '#FFFBEB',
    surface: '#FFFFFF',
    text: '#78350F',
    border: '#FCD34D'
  }
]

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const theme = 'pastel'

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'pastel')
    localStorage.setItem('theme', 'pastel')
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme: () => {}, themes: ['pastel'], textThemes: ['pastel'] }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
