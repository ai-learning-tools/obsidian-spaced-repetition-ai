// tailwind.config.js
module.exports = {
  content: [
      './src/**/*.{js,jsx,ts,tsx}', // Adjust the path according to your project structure
      './index.html',
  ],
  theme: {
      extend: {},
      colors: {
        transparent: 'transparent',
        current: 'currentColor',
        'white': '#ffffff',
        'tahiti': {
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        // ...
      },
  },
  plugins: [],
};
