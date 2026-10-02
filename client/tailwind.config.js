/** Tailwind config — "paper notes" theme: emerald primary (GFG-like green),
 *  warm paper surfaces, amber highlights. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefaf3',
          100: '#d7f2e3',
          200: '#b0e4cb',
          300: '#7dd0aa',
          400: '#47b586',
          500: '#279a6b',
          600: '#1d7d57',
          700: '#196447',
          800: '#15503a',
          900: '#124230',
        },
        paper: '#fffdf7',
        ink: '#1f2937',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(18,66,48,.08), 0 8px 24px -12px rgba(18,66,48,.18)',
      },
    },
  },
  plugins: [],
};
