/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pokedex: {
          red: '#DC0A2D',
          darkred: '#8B0000',
          blue: '#3B4CCA',
          yellow: '#FFDE00',
          gold: '#B3A125',
          screen: '#51AE5E',
          darkscreen: '#306938',
          black: '#0F0F0F',
          gray: '#8B8B8B',
          light: '#DEDEDE',
        },
        element: {
          fire: '#FF5722',
          water: '#2196F3',
          grass: '#4CAF50',
          electric: '#FFEB3B',
          ice: '#00BCD4',
          fighting: '#795548',
          poison: '#9C27B0',
          ground: '#8D6E63',
          flying: '#90CAF9',
          psychic: '#E91E63',
          bug: '#8BC34A',
          dragon: '#673AB7',
        }
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'cursive'],
        mono: ['"Courier New"', 'monospace'],
      },
      animation: {
        'scanline': 'scanline 8s linear infinite',
        'blink': 'blink 1s step-end infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(220, 10, 45, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(220, 10, 45, 0.8)' },
        },
      },
    },
  },
  plugins: [],
};
