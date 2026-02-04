/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0b132b',
        card: '#1c2541',
        accent: '#3a506b',
        accentSoft: '#5bc0be',
        danger: '#ff6b6b'
      }
    }
  },
  plugins: []
};

