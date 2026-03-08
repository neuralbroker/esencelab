/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f2f2f2",
        primary: "#111111",
        secondary: "rgba(17,17,17,0.72)",
        accent: "#111111",
        "accent-soft": "rgba(17,17,17,0.12)",
        border: "rgba(17,17,17,0.16)",
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "sans-serif"],
        serif: ["var(--font-playfair-display)", "serif"],
      },
      backgroundImage: {
        'mesh-ivory': 'radial-gradient(at 40% 20%, hsla(43,40%,95%,1) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(43,20%,97%,1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(43,30%,96%,1) 0px, transparent 50%)',
      },
    },
  },
  plugins: [],
};

