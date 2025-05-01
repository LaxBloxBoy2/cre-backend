/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "#0F1117",
        foreground: "#FFFFFF",
        primary: {
          DEFAULT: "#36FFB0",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#1A1D23",
          foreground: "#A0A4AE",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "#2A2E36",
          foreground: "#A0A4AE",
        },
        accent: {
          DEFAULT: "#36FFB0",
          foreground: "#FFFFFF",
          'gradient-from': '#36FFB0',
          'gradient-to': '#11999E',
        },
        popover: {
          DEFAULT: "#1E222A",
          foreground: "#FFFFFF",
        },
        card: {
          DEFAULT: "#1E222A",
          foreground: "#FFFFFF",
        },
        dark: {
          bg: '#0F1117',
          'bg-secondary': '#1A1D23',
          card: '#1E222A',
          'card-hover': '#2A2E36',
          border: '#2A2D35',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#A0A4AE',
        },
        success: {
          DEFAULT: '#10B981',
          light: '#D1FAE5',
          dark: '#065F46',
        },
        error: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
          dark: '#B91C1C',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          dark: '#B45309',
        },
        info: {
          DEFAULT: '#3B82F6',
          light: '#DBEAFE',
          dark: '#1E40AF',
        },
        // Theme-aware colors using CSS variables
        theme: {
          'bg': 'var(--bg-primary)',
          'card': 'var(--bg-card)',
          'card-hover': 'var(--bg-card-hover)',
          'border': 'var(--border-dark)',
          'text': 'var(--text-primary)',
          'text-muted': 'var(--text-muted)',
          'accent': 'var(--accent)',
          'destructive': 'var(--destructive)',
          'destructive-light': 'var(--destructive-light)',
        },
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'accent-gradient': 'linear-gradient(to right, #30E3CA, #11999E)',
        'blue-gradient': 'linear-gradient(to right, #3B82F6, #1E40AF)',
        'purple-gradient': 'linear-gradient(to right, #8B5CF6, #6366F1)',
        'card-gradient': 'linear-gradient(to bottom right, #0b192e, #04111e)',
        'dark-gradient': 'linear-gradient(to bottom, rgba(15, 17, 23, 0.8), rgba(15, 17, 23, 1))',
      },
      boxShadow: {
        'accent-glow': '0 0 0.5rem rgba(54, 255, 176, 0.6)',
        'blue-glow': '0 0 0.5rem rgba(59, 130, 246, 0.6)',
        'purple-glow': '0 0 0.5rem rgba(139, 92, 246, 0.6)',
        'card-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'dark-shadow': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15)',
        // Theme-aware shadows
        'theme': 'var(--card-shadow)',
        'theme-neon': 'var(--shadow-neon)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0.5rem rgba(54, 255, 176, 0.2)" },
          "50%": { boxShadow: "0 0 1rem rgba(54, 255, 176, 0.6)" },
        },
        "fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(20px)", opacity: 0 },
          "100%": { transform: "translateX(0)", opacity: 1 },
        },
        "slide-in-bottom": {
          "0%": { transform: "translateY(20px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
        "progress-bar": {
          "0%": { width: "0%" },
          "100%": { width: "100%" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fade-in 0.3s ease-in-out",
        "slide-in-right": "slide-in-right 0.3s ease-in-out",
        "slide-in-bottom": "slide-in-bottom 0.3s ease-in-out",
        "progress-bar": "progress-bar 1.5s ease-in-out",
        "bounce-subtle": "bounce-subtle 2s ease-in-out infinite",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
