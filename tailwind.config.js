/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          // Layered Dark UI System
          bg: '#121212',          // Main background
          surface: '#1e1e1e',     // Cards, panels, containers
          elevated: '#262626',    // Hover states, elevated surfaces
          border: '#2a2a2a',      // Borders and separators
          text: {
            primary: '#e5e5e5',   // Primary text
            secondary: '#a1a1aa', // Secondary text
          }
        }
      },
      backgroundColor: {
        'dark-bg': '#121212',
        'dark-surface': '#1e1e1e',
        'dark-elevated': '#262626',
      },
      borderColor: {
        'dark-border': '#2a2a2a',
      },
      textColor: {
        'dark-primary': '#e5e5e5',
        'dark-secondary': '#a1a1aa',
      }
    },
  },
  plugins: [],
};
