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
          orange: '#EA580C',
          hover: '#C2410C',
          highlight: '#F97316',
          tint: '#FFEDD5',
          cream: '#F8F3F0',
          dark: '#181311',
          charcoal: '#1E293B',
        },
        primary: {
          DEFAULT: '#EA580C',
          hover: '#C2410C',
          light: '#FFEDD5',
        },
        surface: '#FFFFFF',
        ground: '#F8F3F0',
        card: '#FFFFFF',
        divider: 'rgba(234, 88, 12, 0.15)',
        heat: {
          0: '#FFFFFF',
          1: '#FFEDD5',
          2: '#FDBA74',
          3: '#FB923C',
          4: '#EA580C',
        },
        semantic: {
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#EA580C',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        heading: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        '2xs': '0 1px 2px rgba(234, 88, 12, 0.04)',
        'xs': '0 1px 3px rgba(234, 88, 12, 0.06)',
      },
    },
  },
  plugins: [],
};
