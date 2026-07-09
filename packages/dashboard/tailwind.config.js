/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#050505",
        surface: "rgba(255,255,255,0.035)",
        "surface-2": "rgba(255,255,255,0.06)",
        line: "rgba(255,255,255,0.08)",
        "line-2": "rgba(255,255,255,0.13)",
        lime: {
          DEFAULT: "#D7FF00",
          soft: "rgba(215,255,0,0.12)",
          2: "#E8FF5A",
        },
        term: { bg: "#050505", card: "#0C0D0B" },
        ink: { DEFAULT: "#FFFFFF", muted: "rgba(255,255,255,0.52)" },
        brand: {
          green: "#D7FF00",
          red: "#FF5A3C",
          amber: "#E8FF5A",
          blue: "rgba(255,255,255,0.45)",
        },
      },
      fontFamily: {
        display: ["Chakra Petch", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: { xl2: "18px" },
      boxShadow: {
        glow: "0 0 20px rgba(215,255,0,0.14)",
        "glow-lg": "0 24px 60px -30px rgba(215,255,0,0.18)",
      },
      animation: {
        marquee: "marquee 60s linear infinite",
        slideInFromTop: "slideInFromTop 0.5s cubic-bezier(.2,.8,.2,1)",
        pulseGlow: "pulseGlow 1.9s ease-in-out infinite",
        radarSpin: "radarSpin 3.4s linear infinite",
        radarPing: "radarPing 2.6s ease-out infinite",
        drawLine: "drawLine 1.8s .2s ease forwards",
        fadeUp: "fadeUp 0.34s ease both",
        eq: "eq 1.1s ease-in-out infinite",
      },
      keyframes: {
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        slideInFromTop: {
          "0%": { opacity: "0", transform: "translateY(-10px) scale(.99)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(215,255,0,0.55)" },
          "70%": { boxShadow: "0 0 0 7px rgba(215,255,0,0)" },
        },
        radarSpin: { to: { transform: "rotate(360deg)" } },
        radarPing: {
          "0%": { r: "4", opacity: ".9" },
          "80%": { opacity: "0" },
          "100%": { r: "40", opacity: "0" },
        },
        drawLine: { to: { strokeDashoffset: "0" } },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "none" },
        },
        eq: {
          "0%, 100%": { transform: "scaleY(.35)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
    },
  },
  plugins: [],
};
