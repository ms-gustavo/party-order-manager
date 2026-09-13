/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ground: token("ground"),
        surface: token("surface"),
        "surface-2": token("surface-2"),
        ink: token("ink"),
        muted: token("muted"),
        line: token("line"),
        pen: token("pen"),
        "pen-soft": token("pen-soft"),
        "pen-ink": token("pen-ink"),
        hi: token("hi"),
        "hi-soft": token("hi-soft"),
        "hi-ink": token("hi-ink"),
        danger: token("danger"),
        receipt: token("receipt"),
        "receipt-line": token("receipt-line"),
        "foot-bg": token("foot-bg"),
        "foot-ink": token("foot-ink"),
      },
      fontFamily: {
        display: ['"Alfa Slab One"', "Georgia", "serif"],
        sans: ["Figtree", "system-ui", "-apple-system", '"Segoe UI"', "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "Menlo", "monospace"],
      },
      keyframes: {
        "sheet-in": { from: { transform: "translateY(100%)" }, to: { transform: "none" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "toast-in": {
          from: { opacity: "0", transform: "translate(-50%, -12px)" },
          to: { opacity: "1", transform: "translate(-50%, 0)" },
        },
      },
      animation: {
        "sheet-in": "sheet-in 240ms cubic-bezier(.2,.8,.2,1)",
        "fade-in": "fade-in 200ms ease-out",
        "toast-in": "toast-in 200ms ease-out",
      },
    },
  },
  plugins: [],
};
