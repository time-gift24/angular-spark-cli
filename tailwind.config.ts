import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx,html}',
  ],
  // Theme is now defined in @theme inline in styles.css
  // Typography plugin is configured via @plugin directive in styles.css (Tailwind v4 approach)
  // See: https://tailwindcss.com/docs/plugins#using-plugins (v4 CSS-first configuration)
  // This minimal config is all we need with Tailwind v4
};

export default config;
