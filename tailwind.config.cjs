/** Tailwind is compiled once and injected inside the Shadow DOM only. */
module.exports = {
  content: ["./src/widget/**/*.{ts,tsx}"],
  darkMode: ["class", ".oo-dark"],
  corePlugins: {},
  theme: {
    extend: {
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: { onion: { 400: "#c084fc", 500: "#a855f7", 600: "#9333ea" } },
      keyframes: {
        pop: { "0%": { opacity: 0, transform: "translateY(6px) scale(.98)" }, "100%": { opacity: 1, transform: "none" } },
      },
      animation: { pop: "pop .16s ease-out" },
    },
  },
  plugins: [],
};
