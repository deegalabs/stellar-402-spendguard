import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Dark Unicorn Palette ──────────────────────────────────
        // Backgrounds
        dark: {
          DEFAULT: "#0B0F1A",
          50: "#111827",
          100: "#151B2B",
          200: "#1A2035",
          300: "#1F2740",
          400: "#252D4A",
          500: "#2D3555",
        },

        // Surface / Cards
        surface: {
          DEFAULT: "#111827",
          dim: "#0B0F1A",
          bright: "#1A2035",
          card: "#151B2B",
          "card-hover": "#1A2035",
          border: "#1E293B",
          "border-light": "#334155",
        },

        // Primary — Electric Indigo
        primary: {
          DEFAULT: "#6366F1",
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
          glow: "rgba(99, 102, 241, 0.15)",
        },

        // Accent — Cyan / Teal
        accent: {
          DEFAULT: "#06B6D4",
          50: "#ECFEFF",
          100: "#CFFAFE",
          200: "#A5F3FC",
          300: "#67E8F9",
          400: "#22D3EE",
          500: "#06B6D4",
          600: "#0891B2",
          700: "#0E7490",
          glow: "rgba(6, 182, 212, 0.15)",
        },

        // Success — Emerald
        success: {
          DEFAULT: "#10B981",
          50: "#ECFDF5",
          100: "#D1FAE5",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          glow: "rgba(16, 185, 129, 0.15)",
        },

        // Error — Rose
        error: {
          DEFAULT: "#F43F5E",
          50: "#FFF1F2",
          100: "#FFE4E6",
          400: "#FB7185",
          500: "#F43F5E",
          600: "#E11D48",
          glow: "rgba(244, 63, 94, 0.15)",
        },

        // Warning — Amber
        warning: {
          DEFAULT: "#F59E0B",
          50: "#FFFBEB",
          100: "#FEF3C7",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
        },

        // Text
        text: {
          DEFAULT: "#F8FAFC",
          primary: "#F1F5F9",
          secondary: "#94A3B8",
          muted: "#64748B",
          disabled: "#475569",
        },
      },
      fontFamily: {
        sans: ["Geist", "Inter", "var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "display": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline": ["1.875rem", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "700" }],
        "title": ["1.25rem", { lineHeight: "1.4", fontWeight: "600" }],
        "label": ["0.75rem", { lineHeight: "1.5", letterSpacing: "0.05em", fontWeight: "600" }],
      },
      boxShadow: {
        "card": "0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.2)",
        "card-hover": "0 4px 12px -1px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.1)",
        "glow-primary": "0 0 20px rgba(99, 102, 241, 0.3)",
        "glow-accent": "0 0 20px rgba(6, 182, 212, 0.3)",
        "glow-success": "0 0 20px rgba(16, 185, 129, 0.3)",
        "glow-error": "0 0 20px rgba(244, 63, 94, 0.3)",
        "panel": "0 10px 40px -10px rgba(0, 0, 0, 0.5)",
        "glass": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
      borderRadius: {
        "card": "12px",
        "xl": "12px",
        "2xl": "16px",
      },
      backdropBlur: {
        "glass": "12px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "shimmer": "shimmer 2s linear infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(99, 102, 241, 0.2)" },
          "100%": { boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
