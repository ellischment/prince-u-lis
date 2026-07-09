import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#182A4A',
        'navy-deep': '#101E39',
        'navy-soft': '#20345A',
        card: '#3E5779',
        'card-hover': '#46618A',
        cream: '#EDCA9D',
        'cream-strong': '#F3D9B4',
        paper: '#F5EFE4',
        muted: '#AFBDD6',
        fox: '#D96E30',
        'fox-soft': '#E8895B',
        green: '#1E3329',
        'green-deep': '#152720',
        ok: '#7FC7A4',
        warn: '#E58A6B',
        // Админка
        'adm-bg': '#F3F0E9',
        'adm-panel': '#FFFFFF',
        'adm-line': '#E3DDCF',
        'adm-ink': '#1A2233',
        'adm-muted': '#5A6478',
        'ok-bg': '#E4F3EB',
        'ok-adm': '#177A50',
        'warn-bg': '#FBE7DD',
        'warn-adm': '#B4491F',
        'info-bg': '#E3E7FA',
        info: '#2C3E9E',
      },
      fontFamily: {
        forum: ['var(--font-forum)', 'serif'],
        manrope: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '26px',
        chip: '14px',
      },
      boxShadow: {
        card: '0 18px 44px rgba(6,12,26,.45)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(.22,1,.36,1)',
      },
    },
  },
  plugins: [],
}
export default config
