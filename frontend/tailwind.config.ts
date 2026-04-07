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
        // ── Material Design 3 — Stitch Token System ────────────────
        // Primary
        primary: {
          DEFAULT: "#010953",
          fixed: "#dfe0ff",
          "fixed-dim": "#bcc2ff",
          container: "#1a2366",
        },
        "on-primary": "#ffffff",
        "on-primary-container": "#848dd5",
        "on-primary-fixed": "#071157",
        "on-primary-fixed-variant": "#384184",
        "inverse-primary": "#bcc2ff",

        // Secondary
        secondary: {
          DEFAULT: "#2563EB",
          fixed: "#dbe1ff",
          "fixed-dim": "#b4c5ff",
          container: "#316bf3",
        },
        "on-secondary": "#ffffff",
        "on-secondary-container": "#fefcff",
        "on-secondary-fixed": "#00174b",
        "on-secondary-fixed-variant": "#003ea8",

        // Tertiary (green / accent)
        tertiary: {
          DEFAULT: "#001b0f",
          fixed: "#6ffbbe",
          "fixed-dim": "#4edea3",
          container: "#003220",
        },
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#00a673",
        "on-tertiary-fixed": "#002113",
        "on-tertiary-fixed-variant": "#005236",

        // Error
        error: {
          DEFAULT: "#ba1a1a",
          container: "#ffdad6",
        },
        "on-error": "#ffffff",
        "on-error-container": "#93000a",

        // Surface system
        surface: {
          DEFAULT: "#f7f9fd",
          dim: "#d8dade",
          bright: "#f7f9fd",
          tint: "#50599d",
          variant: "#e0e3e6",
          container: "#eceef2",
          "container-low": "#f2f4f8",
          "container-lowest": "#ffffff",
          "container-high": "#e6e8ec",
          "container-highest": "#e0e3e6",
        },
        "on-surface": "#191c1f",
        "on-surface-variant": "#464650",
        "inverse-surface": "#2d3134",
        "inverse-on-surface": "#eff1f5",

        // Outline
        outline: {
          DEFAULT: "#767681",
          variant: "#c6c5d2",
        },

        // Background
        background: "#f4f6fa",
        "on-background": "#191c1f",

        // ── Legacy aliases (backward compat) ──────────────────────
        accent: {
          DEFAULT: "#10B981",
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
        },
        neutral: {
          DEFAULT: "#F4F6FA",
          50: "#FAFBFD",
          100: "#F4F6FA",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },
        danger: {
          DEFAULT: "#EF4444",
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
        },
        warning: {
          DEFAULT: "#F59E0B",
          50: "#FFFBEB",
          100: "#FEF3C7",
          300: "#FCD34D",
          500: "#F59E0B",
          600: "#D97706",
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
        "card": "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)",
        "card-hover": "0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)",
        "panel": "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.03)",
        "bento": "0 24px 40px -15px rgba(1, 9, 83, 0.04)",
        "hero": "0 24px 40px rgba(1, 9, 83, 0.06)",
      },
      borderRadius: {
        "card": "12px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
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
      },
    },
  },
  plugins: [],
};
export default config;
