import "./globals.css";
import "@/css/bootstrap.min.css";
import "@/css/style.css";
import "@/css/typography.css";
import "@/css/variable.css";
import "@/css/style-customizer.css";
import "@/css/fontawesome.css";
//import { MyHisaSideBar } from "@/components";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";
import { cookies } from "next/headers";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { User } from "@/utils/types";

export const metadata = {
  title: "Hisa:Send Airtime and Data",
  description: "Hisa:Send Airtime and Data",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const cookie = cookies();
  // const user = cookie.get(apiEndpoints.userSetUrl);
  // let userJSON: User | null = null;
  // if (user) {
  //   userJSON = JSON.parse(user.value);
  // }
  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <ResponsiveSidebar>{children}</ResponsiveSidebar>
        </AntdRegistry>
      </body>
    </html>
  );
}
