import "./globals.css";
import "@/css/bootstrap.min.css";
import "@/css/style.css";
import "@/css/typography.css";
import "@/css/variable.css";
import "@/css/style-customizer.css";
import "@/css/fontawesome.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import { Manrope, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import EnvironmentBanner from "@/components/EnvironmentBanner";
import AppShell from "@/components/shell/AppShell";
import { isSandbox } from "@/utils/environment";
import { antdTheme } from "@/utils/theme";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata = {
  // SANDBOX: prefix the tab title so sandbox tabs are easy to tell apart.
  // AppShell refines this per page from the active nav item.
  title: `${isSandbox ? "[SANDBOX] " : ""}Hisa:Send Airtime and Data`,
  description: "Hisa:Send Airtime and Data",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <body>
        <AntdRegistry>
          <ConfigProvider theme={antdTheme}>
            {/* SANDBOX: test-mode / misconfiguration banner on every page. */}
            <EnvironmentBanner />
            <AppShell>{children}</AppShell>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
