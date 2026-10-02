/** Tailwind config — lavender theme: primary lavender
 *  (#7C6BD9 at brand-500), clean white surfaces, soft paper article cards. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F6F4FC',
          100: '#ECE8F9',
          200: '#D9D1F2',
          300: '#BCAEE8',
          400: '#9D8ADB',
          500: '#7C6BD9',
          600: '#6A55C7',
          700: '#5744A8',
          800: '#483A85',
          900: '#3B3169',
        },
        paper: '#FCFAFF',
        ink: '#1f2937',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(87,68,168,.08), 0 8px 24px -12px rgba(87,68,168,.18)',
        'card-hover': '0 2px 6px rgba(87,68,168,.10), 0 18px 36px -12px rgba(87,68,168,.28)',
      },
    },
  },
  plugins: [],
};
