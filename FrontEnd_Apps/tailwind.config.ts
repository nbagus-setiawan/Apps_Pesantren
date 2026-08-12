import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          900: '#0B2E6B',
          700: '#12408F',
          500: '#1E5FD9',
          300: '#5C8DF0',
          100: '#E7EEFD',
        },
        accent: {
          gold: '#F2B705',
        },
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#DC2626',
        neutral: {
          900: '#111827',
          500: '#6B7280',
          100: '#F3F4F6',
        },
      },
      fontFamily: {
        heading: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        h1: ['28px', { lineHeight: '32px', fontWeight: '600' }],
        h2: ['22px', { lineHeight: '26px', fontWeight: '600' }],
        h3: ['18px', { lineHeight: '24px', fontWeight: '600' }],
        caption: ['12px', { lineHeight: '16px' }],
      },
      borderRadius: {
        card: '16px',
        control: '12px',
      },
      boxShadow: {
        soft: '0 4px 12px rgba(11,46,107,0.08)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(160deg, #0B2E6B 0%, #1E5FD9 60%, #5C8DF0 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
