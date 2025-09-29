import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
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
          glow: "hsl(var(--primary-glow))",
          muted: "hsl(var(--primary-muted))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          light: "hsl(var(--secondary-light))",
          muted: "hsl(var(--secondary-muted))",
        },
        // Industrial color palette
        steel: {
          DEFAULT: "hsl(var(--steel-gray))",
          light: "hsl(var(--steel-gray-light))",
          dark: "hsl(var(--steel-gray-dark))",
        },
        precision: {
          DEFAULT: "hsl(var(--precision-blue))",
          light: "hsl(var(--precision-blue-light))",
        },
        safety: {
          DEFAULT: "hsl(var(--safety-orange))",
          light: "hsl(var(--safety-orange-light))",
        },
        machine: {
          DEFAULT: "hsl(var(--machine-yellow))",
          light: "hsl(var(--machine-yellow-light))",
        },
        industrial: {
          DEFAULT: "hsl(var(--industrial-red))",
          light: "hsl(var(--industrial-red-light))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        pending: "hsl(var(--pending))",
        approved: "hsl(var(--approved))",
        certified: "hsl(var(--certified))",
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "20px",
        "2xl": "24px",
        "3xl": "32px",
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-secondary': 'var(--gradient-secondary)',
        'gradient-hero': 'var(--gradient-hero)',
        'gradient-card': 'var(--gradient-card)',
        'gradient-glass': 'var(--gradient-glass)',
        'gradient-steel': 'var(--gradient-steel)',
        'gradient-machine': 'var(--gradient-machine)',
        'gradient-precision': 'var(--gradient-precision)',
      },
      boxShadow: {
        'minimal': 'var(--shadow-minimal)',
        'soft': 'var(--shadow-soft)',
        'medium': 'var(--shadow-medium)',
        'large': 'var(--shadow-large)',
        'focus': 'var(--shadow-focus)',
        'panel': 'var(--shadow-panel)',
        'control': 'var(--shadow-control)',
        'pressed': 'var(--shadow-pressed)',
      },
      transitionTimingFunction: {
        'quick': 'var(--transition-quick)',
        'smooth': 'var(--transition-smooth)',
        'elegant': 'var(--transition-elegant)',
        'spring': 'var(--transition-spring)',
        'mechanical': 'var(--transition-mechanical)',
        'factory': 'var(--transition-factory)',
      },
      fontFamily: {
        'sans': ['TH Sarabun New', 'Inter', 'system-ui', 'sans-serif'],
        'heading': ['TH Chakra Petch', 'Inter', 'system-ui', 'sans-serif'],
        'thai': ['TH Sarabun New', 'Noto Sans Thai', 'sans-serif'],
        'english': ['Inter', 'system-ui', 'sans-serif'],
        'apple': ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        'industrial': ['"SF Pro Display"', '"Roboto"', '"Helvetica Neue"', 'Arial', 'system-ui', 'sans-serif'],
        'mono-industrial': ['"SF Mono"', '"Monaco"', '"Cascadia Code"', '"Roboto Mono"', 'monospace'],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
            opacity: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
            opacity: "1",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
            opacity: "1",
          },
          to: {
            height: "0",
            opacity: "0",
          },
        },
        "fade-in": {
          from: {
            opacity: "0",
            transform: "translateY(8px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "slide-in": {
          from: {
            opacity: "0",
            transform: "translateX(-16px)",
          },
          to: {
            opacity: "1",
            transform: "translateX(0)",
          },
        },
        "slide-up": {
          from: {
            opacity: "0",
            transform: "translateY(16px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "scale-in": {
          from: {
            opacity: "0",
            transform: "scale(0.95)",
          },
          to: {
            opacity: "1",
            transform: "scale(1)",
          },
        },
        "machine-pulse": {
          "0%, 100%": {
            opacity: "1",
          },
          "50%": {
            opacity: "0.7",
          },
        },
        "precision-scan": {
          "0%": {
            transform: "translateX(-100%)",
          },
          "100%": {
            transform: "translateX(100%)",
          },
        },
        "factory-spin": {
          from: {
            transform: "rotate(0deg)",
          },
          to: {
            transform: "rotate(360deg)",
          },
        },
        "conveyor-belt": {
          "0%": {
            transform: "translateX(0)",
          },
          "100%": {
            transform: "translateX(24px)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "accordion-up": "accordion-up 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "fade-in": "fade-in 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-in": "slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-up": "slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "scale-in": "scale-in 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "machine-pulse": "machine-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "precision-scan": "precision-scan 2s linear infinite",
        "factory-spin": "factory-spin 1s linear infinite",
        "conveyor-belt": "conveyor-belt 3s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
