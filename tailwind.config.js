/** @type {import('tailwindcss').Config} */
export default {
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
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Cyber theme colors
        cyber: {
          green: "hsl(var(--cyber-green))",
          cyan: "hsl(var(--cyber-cyan))",
          purple: "hsl(var(--cyber-purple))",
          red: "hsl(var(--cyber-red))",
          amber: "hsl(var(--cyber-amber))",
          terminal: "hsl(var(--terminal-green))",
          obsidian: "#080b10",
          card: "rgba(13, 20, 32, 0.8)",
        },
      },
      boxShadow: {
        'cyber-green': '0 0 20px rgba(0, 255, 101, 0.35)',
        'cyber-cyan': '0 0 20px rgba(0, 240, 255, 0.35)',
        'cyber-card': '0 0 35px rgba(0, 240, 255, 0.10)',
        'cyber-purple': '0 0 20px rgba(168, 85, 247, 0.35)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        "glow-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 5px rgba(0, 255, 65, 0.3)",
          },
          "50%": {
            boxShadow: "0 0 20px rgba(0, 255, 65, 0.6)",
          },
        },
        "scan-line": {
          "0%": {
            transform: "translateY(-100%)",
          },
          "100%": {
            transform: "translateY(100%)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "scan-line": "scan-line 8s linear infinite",
      },
      fontFamily: {
        mono: ['Courier New', 'Consolas', 'Monaco', 'monospace'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
