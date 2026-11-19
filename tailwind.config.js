/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          '"SF Pro Display"',
          "system-ui",
          "sans-serif",
        ],
      },
      colors: {
        // Apple Semantic Design Tokens mapped to CSS variables
        canvas: "var(--bg-canvas)",
        elevated: "var(--bg-elevated)",
        nested: "var(--bg-nested)",
        hairline: "var(--border-hairline)",
        "label-primary": "var(--label-primary)",
        "label-secondary": "var(--label-secondary)",
        "accent-blue": "var(--accent-blue)",
        glass: "var(--glass-bg)",

        // CPCB AQI Scale color palette mapped to accessible tokens
        cpcb: {
          good: "#00b050",
          satisfactory: "#92d050",
          moderate: "#ffff00",
          poor: "#ff9900",
          veryPoor: "#ff0000",
          severe: "#c00000",
        },
      },
      boxShadow: {
        apple: "0 2px 12px rgba(0, 0, 0, 0.04)",
        "apple-hover": "0 6px 20px rgba(0, 0, 0, 0.07)",
      },
      backdropSaturate: {
        180: "1.8",
      },
    },
  },
  plugins: [],
};
