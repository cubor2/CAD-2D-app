export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
          colors: {
            'drawhard-beige': '#FFFFFF',
            'drawhard-grid': '#D8D3C7',
            'drawhard-dark': '#2B2B2B',
            'drawhard-accent': '#E44A33',
            'drawhard-text': '#1F1F1F',
            'drawhard-hover': '#4A4A4A',
            'drawhard-panel': '#FFFFFF',
          },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        'extra-wide': '0.15em',
      },
    },
  },
  plugins: [],
}


