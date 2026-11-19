/** @type {import('tailwindcss').Config} */
export default {
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
        // Apple-inspired minimalist palette
        apple: {
          canvas: "#F5F5F7",
          card: "#FFFFFF",
          ink: "#1D1D1F",
          secondary: "#6E6E73",
          tertiary: "#86868B",
          blue: "#0071E3",
          blueHover: "#0077ED",
          border: "rgba(0, 0, 0, 0.06)",
        },
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
    },
  },
  plugins: [],
};
