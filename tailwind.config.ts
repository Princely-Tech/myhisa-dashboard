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
      },
    },
  },
  plugins: [],
};
export default config;
