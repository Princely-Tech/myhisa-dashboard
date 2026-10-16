import type { Config } from "tailwindcss";

const config: Config = {
  important: true,
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
   
  ],
  theme: {
    extend: {
      colors: {
        steelBlue: "#344054",
        slateGray: "#989BB3",
        royalBlue: "#103FD5",
        eigengrau: "#101828",
        // Redesign tokens (mirrors utils/theme.ts hisaColors).
        hisa: {
          ground: "#F5F7FA",
          border: "#E4E7EC",
          ink: "#101828",
          body: "#344054",
          muted: "#475467",
          primary: "#103FD5",
          "primary-hover": "#0B2FA8",
          "primary-soft": "#EAF0FF",
          navy: "#0A1A4A",
        },
      },
      fontFamily: {
        heading: ["var(--font-manrope)", "Manrope", "system-ui", "sans-serif"],
        body: ["var(--font-plex-sans)", "IBM Plex Sans", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "IBM Plex Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
