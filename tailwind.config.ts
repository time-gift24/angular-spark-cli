import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx,html}',
  ],
  // Theme is now defined in @theme inline in styles.css
  // This minimal config is all we need with Tailwind v4
};

export default config;
