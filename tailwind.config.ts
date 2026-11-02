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
        ink: "#0C1A33",
        paper: "#FBF9F4",
        line: "#E4DFD4",
        mist: "#F4F1EA",
        slate: { soft: "#586071" },
        brand: { DEFAULT: "#2750F2", deep: "#1B3CC4", tint: "#EEF2FF", soft: "#D4DDFF" },

        sea: { DEFAULT: "#2750F2", deep: "#1B3CC4", mist: "#EEF2FF" },
        sky: { wash: "#F4F1EA" },
        sand: "#FFF4E0",
        flare: { DEFAULT: "#F5A524", dark: "#9A5700" },
        go: "#0E9F6E",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(12,26,51,0.05)",
        card: "0 1px 2px rgba(12,26,51,0.05), 0 12px 28px -16px rgba(12,26,51,0.22)",
        float: "0 18px 48px -18px rgba(12,26,51,0.38)",
      },
      keyframes: {
        pop: { "0%": { opacity: "0", transform: "translateY(12px) scale(.985)" }, "100%": { opacity: "1", transform: "translateY(0) scale(1)" } },
        fade: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
      },
      animation: {
        pop: "pop .26s cubic-bezier(.2,.7,.2,1) both",
        fade: "fade .8s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
