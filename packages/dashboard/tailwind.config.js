/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        term: {
          bg: "#080A0F",
          card: "#0D1117",
        },
        ink: {
          DEFAULT: "#E6EDF3",
          muted: "rgba(230,237,243,0.45)",
        },
        brand: {
          green: "#00D395",
          red: "#FF4D4D",
          amber: "#F0A500",
          blue: "#3B82F6",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Menlo", "monospace"],
        sans: ["JetBrains Mono", "Menlo", "monospace"],
      },
      animation: {
        marquee: "marquee 60s linear infinite",
        slideInFromTop: "slideInFromTop 0.3s ease-out",
        pulseGlow: "pulseGlow 2s ease-in-out infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        slideInFromTop: {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": {
            opacity: "1",
            boxShadow: "0 0 0 0 rgba(0,211,149,0.4)",
          },
          "50%": {
            opacity: "0.6",
            boxShadow: "0 0 8px 2px rgba(0,211,149,0.4)",
          },
        },
      },
    },
  },
  plugins: [],
};
