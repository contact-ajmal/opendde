import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-hover': 'var(--surface-hover)',
        'surface-alt': 'var(--surface-alt)',
        border: 'var(--border)',
        'border-hover': 'var(--border-hover)',
        primary: 'var(--accent)',
        'primary-hover': 'var(--accent-hover)',
        foreground: 'var(--text)',
        muted: 'var(--text-secondary)',
        'muted-2': 'var(--text-tertiary)',
        danger: 'var(--danger)',
        warning: 'var(--warning)',
      },
    },
  },
  plugins: [],
};

export default config;
