/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'rgb(var(--paper) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        field: 'rgb(var(--field) / <alpha-value>)',
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          soft: 'rgb(var(--ink-soft) / <alpha-value>)',
        },
        line: 'rgb(var(--line) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          dark: 'rgb(var(--accent-dark) / <alpha-value>)',
          soft: 'rgb(var(--accent-soft) / <alpha-value>)',
        },
        'on-accent': 'rgb(var(--on-accent) / <alpha-value>)',
        ok: {
          DEFAULT: 'rgb(var(--ok) / <alpha-value>)',
          soft: 'rgb(var(--ok-soft) / <alpha-value>)',
        },
        warn: {
          DEFAULT: 'rgb(var(--warn) / <alpha-value>)',
          soft: 'rgb(var(--warn-soft) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(15 23 42 / 0.05), 0 4px 12px -2px rgb(15 23 42 / 0.08)',
        card: '0 1px 3px 0 rgb(15 23 42 / 0.04), 0 10px 24px -6px rgb(15 23 42 / 0.08)',
        elevated: '0 12px 32px -4px rgb(15 23 42 / 0.12), 0 4px 12px -2px rgb(15 23 42 / 0.06)',
      },
      transitionTimingFunction: { out: 'cubic-bezier(0.23, 1, 0.32, 1)' },
    },
  },
  plugins: [],
};
