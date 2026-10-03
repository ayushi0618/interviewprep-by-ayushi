/** Tailwind config — professional design system.
 *  Primary: refined indigo (brand-*). Neutrals: slate (paper/ink +
 *  tailwind slate-*). One restrained accent (deep teal) lives in
 *  index.css as .btn-accent / .badge-accent; difficulty colors are
 *  semantic (emerald/amber/rose) via .diff-* in index.css.
 *  Tokens documented as CSS variables in src/index.css (:root). */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },
        paper: '#F8FAFC',
        ink: '#0F172A',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,.05), 0 4px 16px -8px rgba(15,23,42,.10)',
        'card-hover': '0 2px 4px rgba(15,23,42,.06), 0 12px 32px -12px rgba(15,23,42,.16)',
      },
    },
  },
  plugins: [],
};
