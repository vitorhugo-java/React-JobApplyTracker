/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Monochrome design system (Notion + Vercel vibe)
        mono: {
          0: '#000',
          1: '#111',
          2: '#222',
          5: '#555',
          9: '#999',
          c: '#cfcfcf',
          e5: '#e5e5e5',
          f5: '#f5f5f5',
          w: '#fff',
        },
        danger: '#7a2e2e',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', '"SF Mono"', 'Menlo', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '4px',
      },
      fontSize: {
        eyebrow: ['10.5px', { lineHeight: '1.2', letterSpacing: '0.08em' }],
      },
      maxWidth: {
        page: '1280px',
        form: '680px',
        settings: '760px',
      },
    },
  },
  plugins: [],
}
