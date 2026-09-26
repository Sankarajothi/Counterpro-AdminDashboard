/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#FD5E03',
          black: '#101318',
          light: '#FFF7ED',
          border: '#FED7AA',
        },
        accent: {
          50: '#FFF9F5',
          100: '#FFF7ED',
          200: '#FFEDD5',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#FD5E03',
          600: '#EA580C',
          700: '#FD5E03',
          800: '#C2410C',
          900: '#101318',
        },
        surface: '#FAFAFB',
        divider: '#E2E4E8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
