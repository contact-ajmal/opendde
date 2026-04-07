import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#020617',
        surface: '#0f172a',
        border: '#334155',
        primary: '#10b981',
        foreground: '#f8fafc',
        muted: '#94a3b8',
      },
    },
  },
  plugins: [],
};

export default config;
