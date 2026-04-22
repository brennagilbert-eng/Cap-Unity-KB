/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        night: '#FFFFFF',
        earth: '#007DFF',
        sun: '#F59E0B',
        mars: '#EF4444',
        surface: '#F0F5FF',
        card: '#FFFFFF',
        border: '#D6E4FF',
        muted: '#6B8CC7',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
