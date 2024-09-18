// tailwind.config.js

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom brand colors
        primary: '#86EFAC', // Replace with your actual primary color
        'primary-dark': '#F5BE0B', // Replace with your actual darker primary color
        // Add any additional custom colors here
      },
      fontFamily: {
        // Custom font family
        custom: ['Urbanist', 'sans-serif'], // Replace 'Inter' with your actual custom font
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};

export default config;