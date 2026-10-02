/** Tailwind config — GeeksforGeeks-style green theme: GFG primary green
 *  (#308D46 at brand-600), clean white surfaces, warm paper article cards. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff7f1',
          100: '#daeee0',
          200: '#b6dec2',
          300: '#86c498',
          400: '#57a66d',
          500: '#388e4d',
          600: '#308d46',
          700: '#28753a',
          800: '#215e30',
          900: '#1c4d28',
        },
        paper: '#fffdf7',
        ink: '#1f2937',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(28,77,40,.08), 0 8px 24px -12px rgba(28,77,40,.18)',
        'card-hover': '0 2px 6px rgba(28,77,40,.10), 0 18px 36px -12px rgba(28,77,40,.28)',
      },
    },
  },
  plugins: [],
};
