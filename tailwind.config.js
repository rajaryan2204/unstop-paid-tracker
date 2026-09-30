/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        desk: {
          bg: '#0B0D11',
          card: '#11141A',
          elevated: '#161A22',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-strong': 'rgba(255, 255, 255, 0.16)',
          accent: '#38bdf8',
          green: '#10b981',
          purple: '#c084fc',
          amber: '#fbbf24',
          rose: '#fb7185'
        }
      },
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace']
      },
      boxShadow: {
        'subtle-inner': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.07)',
        'glow-cyan': '0 0 20px -5px rgba(56, 189, 248, 0.3)',
        'glow-green': '0 0 20px -5px rgba(16, 185, 129, 0.3)',
      }
    },
  },
  plugins: [],
}
