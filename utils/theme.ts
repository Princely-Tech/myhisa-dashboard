import type { ThemeConfig } from "antd";
import constants from "./constants";

// Design tokens for the redesigned UI (see tailwind.config.ts `hisa` colours,
// which mirror these). Fonts are the CSS variables set by next/font in
// app/layout.tsx.
export const hisaColors = {
  ground: "#F5F7FA",
  border: "#E4E7EC",
  ink: "#101828",
  body: "#344054",
  muted: "#475467",
  primary: "#103FD5",
  primaryHover: "#0B2FA8",
  navy: "#0A1A4A",
};

export const FONT_BODY = "var(--font-plex-sans), 'IBM Plex Sans', system-ui, sans-serif";

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: hisaColors.primary,
    colorLink: hisaColors.primary,
    colorLinkHover: hisaColors.primaryHover,
    colorText: hisaColors.ink,
    borderRadius: 10,
    fontFamily: FONT_BODY,
    // Previously-unused constants.antdGlobalConfig values (also read by
    // components/inputs.tsx), now applied app-wide.
    colorBorder: constants.antdGlobalConfig.colorBorder,
    colorTextPlaceholder: constants.antdGlobalConfig.colorTextPlaceholder,
  },
};
