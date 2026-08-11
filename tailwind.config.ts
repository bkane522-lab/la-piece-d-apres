import type { Config } from 'tailwindcss';
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: {
    colors: {
      forest: '#143A2A', emerald: '#0F5B46', ivory: '#F7F1E5', cream: '#EFE6D3', gold: '#C6A15B', ink: '#1D241F'
    },
    fontFamily: { serif: ['Georgia','serif'], sans: ['Arial','sans-serif'] }
  }},
  plugins: []
} satisfies Config;
