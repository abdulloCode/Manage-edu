/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    'node_modules/preline/dist/*.js',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui'),
    require('@tailwindcss/typography'),
  ],
  daisyui: {
    themes: [
      {
        pastel: {
          'color-scheme': 'light',
          primary: 'oklch(90% 0.063 306.703)',
          'primary-content': 'oklch(49% 0.265 301.924)',
          secondary: 'oklch(89% 0.058 10.001)',
          'secondary-content': 'oklch(51% 0.222 16.935)',
          accent: 'oklch(90% 0.093 164.15)',
          'accent-content': 'oklch(50% 0.118 165.612)',
          neutral: 'oklch(55% 0.046 257.417)',
          'neutral-content': 'oklch(92% 0.013 255.508)',
          'base-100': 'oklch(100% 0 0)',
          'base-200': 'oklch(98.462% 0.001 247.838)',
          'base-300': 'oklch(92.462% 0.001 247.838)',
          'base-content': 'oklch(20% 0 0)',
          info: 'oklch(86% 0.127 207.078)',
          'info-content': 'oklch(52% 0.105 223.128)',
          success: 'oklch(87% 0.15 154.449)',
          'success-content': 'oklch(52% 0.154 150.069)',
          warning: 'oklch(83% 0.128 66.29)',
          'warning-content': 'oklch(55% 0.195 38.402)',
          error: 'oklch(80% 0.114 19.571)',
          'error-content': 'oklch(50% 0.213 27.518)',
          '--rounded-box': '1rem',
          '--rounded-btn': '2rem',
          '--rounded-badge': '1rem',
        },
      },
    ],
    defaultTheme: 'pastel',
  },
}
