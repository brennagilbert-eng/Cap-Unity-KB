/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        night: '#002B67',
        earth: '#007DFF',
        sun: '#FF9F00',
        mars: '#FF0E47',
        surface: '#001A40',
        card: '#00234F',
        border: '#003580',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
