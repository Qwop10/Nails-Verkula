/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ★ Все токены читают CSS-переменные активной темы (см. src/config/theme.config.ts).
        //   Формат rgb(var(--x) / <alpha-value>) — чтобы работали и bg-brand/15, border-line и т.п.
        // Surfaces
        page: 'rgb(var(--page) / <alpha-value>)',          // app background
        card: 'rgb(var(--surface) / <alpha-value>)',       // cards, inputs, chips, secondary buttons
        'card-2': 'rgb(var(--surface-2) / <alpha-value>)', // hover / elevated surface
        line: 'rgb(var(--line) / <alpha-value>)',          // borders, dividers, progress track

        // Text
        fg: 'rgb(var(--text) / <alpha-value>)',            // основной текст темы (вместо хардкода white/black)
        muted: 'rgb(var(--muted) / <alpha-value>)',        // secondary text / subtitles
        hint: 'rgb(var(--hint) / <alpha-value>)',          // placeholders / disabled hints

        // Brand (accent) — driven by the active theme
        brand: {
          light: 'rgb(var(--brand-light) / <alpha-value>)',
          DEFAULT: 'rgb(var(--brand) / <alpha-value>)',
          dark: 'rgb(var(--brand-dark) / <alpha-value>)',
          muted: 'rgb(var(--brand-muted) / <alpha-value>)',     // disabled primary button
          tint: 'rgb(var(--brand-light) / <alpha-value>)',      // selected chip / icon circle
          contrast: 'rgb(var(--brand-contrast) / <alpha-value>)', // text/icon on a brand-filled surface
        },

        // Legacy aliases → mapped onto theme tokens
        cream: 'rgb(var(--page) / <alpha-value>)',
        graybg: 'rgb(var(--page) / <alpha-value>)',

        // Warning (parental-consent notice) — static, theme-independent
        warn: {
          bg: '#2A2310',
          line: '#6E5A1E',
          text: '#E0C879',
          icon: '#E2A93B',
        },

        // Kept for any remaining references; mapped onto the brand accent
        sky: {
          50: 'rgb(var(--brand-dark) / <alpha-value>)',
          100: 'rgb(var(--brand-dark) / <alpha-value>)',
          200: 'rgb(var(--brand-dark) / <alpha-value>)',
          300: 'rgb(var(--brand) / <alpha-value>)',
          400: 'rgb(var(--brand) / <alpha-value>)',
          500: 'rgb(var(--brand-light) / <alpha-value>)',
          600: 'rgb(var(--brand) / <alpha-value>)',
          700: 'rgb(var(--brand-dark) / <alpha-value>)',
          800: 'rgb(var(--brand-dark) / <alpha-value>)',
          900: 'rgb(var(--brand-dark) / <alpha-value>)',
        },
      },
      borderRadius: {
        // ★ Тематический радиус карточек/плиток (из theme.config.ts → radius).
        card: 'var(--radius-card)',
        tile: 'var(--radius-tile)',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', '-apple-system', 'BlinkMacSystemFont', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}
