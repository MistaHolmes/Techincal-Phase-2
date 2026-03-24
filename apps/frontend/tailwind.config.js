// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
theme: {
  extend: {
    colors: {
      main: 'var(--main)',
      overlay: 'var(--overlay)',
      bg: 'var(--bg)',
      bw: 'var(--bw)',
      blank: 'var(--blank)',
      text: 'var(--text)',
      mtext: 'var(--mtext)',
      border: 'var(--border)',
      ring: 'var(--ring)',
      ringOffset: 'var(--ring-offset)',
      
      secondaryBlack: '#212121',
      // Stitch Design Tokens
      "stitch-surface": "#f9f9f9",
      "stitch-on-surface": "#1b1b1b",
      "stitch-secondary": "#5f5e5e",
      "stitch-tertiary-container": "#8f7100",
      "stitch-surface-container-high": "#e8e8e8",
      "stitch-surface-container-low": "#f3f3f3",
      "stitch-outline-variant": "#c6c6c6",
    },
    borderRadius: {
      base: '5px'
    },
    boxShadow: {
      shadow: 'var(--shadow)'
    },
    translate: {
      boxShadowX: '4px',
      boxShadowY: '4px',
      reverseBoxShadowX: '-4px',
      reverseBoxShadowY: '-4px',
    },
    fontWeight: {
      base: '500',
      heading: '700',
    },
    fontFamily: {
      playfair: ['"Playfair Display"', 'serif'],
      "headline": ["Newsreader", "serif"],
      "body": ["Manrope", "sans-serif"],
      "label": ["Manrope", "sans-serif"]
    },
  },
},
  plugins: [],
}