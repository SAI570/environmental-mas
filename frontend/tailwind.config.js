/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        charcoal: {
          900: '#0f172a',
          950: '#080d1a',
        },
        ops: {
          normal: '#10b981',   // Emerald Green
          warning: '#f59e0b',  // Amber
          danger: '#ef4444',   // Red
          critical: '#f97316', // Orange
          failed: '#64748b',   // Slate Gray
          comm: '#3b82f6',     // Electric Blue
        }
      },
    },
  },
  plugins: [],
}
