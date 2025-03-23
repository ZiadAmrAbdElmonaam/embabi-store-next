/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)'],
        arabic: ['var(--font-ibm-plex-sans-arabic)'],
      },
      backgroundColor: {
        dark: {
          DEFAULT: '#1a1a1a',
          navbar: '#141414',
          card: '#252525',
        },
      },
    },
  },
  plugins: [],
}; 