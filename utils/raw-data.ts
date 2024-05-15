import { SideBarItem, ImgIcon } from "./types";

import routes from "@/utils/routes";
import {
  bankNote,
  bankNote2,
  codeSquare,
  creditCard,
  dashboardIcon,
  eye,
  homeIcon,
  houseIcon,
  lifeBuoy,
  linkIcon,
  moneys,
  moneySend,
  padlock,
  questionRounded,
  recieptEdit,
  refresh,
  settingicon,
  shieldTick,
  twoPersicon,
  users,
} from "./images";
// const dashboard = new SideBarItem({
//   route: `${routes.dashboard}?verified=false`,
//   label: "Dashboard",
//   icon: new ImgIcon({ src: dashboardIcon, alt: "Dashboard" }),
// });
const payments = new SideBarItem({
  route: routes.transfer,
  label: "Payments",
  icon: new ImgIcon({ src: houseIcon, alt: "Payments" }),
});
const loans = new SideBarItem({
  route: routes.credit,
  label: "Loans",
  icon: new ImgIcon({ src: bankNote, alt: "Loans" }),
});
const credit = new SideBarItem({
  route: routes.credit,
  label: "Credit",
  icon: new ImgIcon({ src: bankNote, alt: "Credit" }),
});
const home = new SideBarItem({
  route: `${routes.dashboard}?verified=false`,
  label: "Home",
  icon: new ImgIcon({ src: homeIcon, alt: "Home" }),
});
const marketPlace = new SideBarItem({
  route: routes.marketPlace,
  label: "Marketplace",
  icon: new ImgIcon({ src: twoPersicon, alt: "Marketplace" }),
});
const fraudProtection = new SideBarItem({
  route: routes.fraudProtection,
  label: "Fraud Protection",
  icon: new ImgIcon({ src: padlock, alt: "Fraud Protection" }),
});
const helpAndsupport = new SideBarItem({
  route: "#",
  label: "Help & Support",
  icon: new ImgIcon({ src: questionRounded, alt: "Help & Support" }),
});
const settings = new SideBarItem({
  route: routes.profile,
  label: "Settings",
  icon: new ImgIcon({ src: settingicon, alt: "Settings" }),
});
const invoice = new SideBarItem({
  route: routes.invoice,
  label: "Invoice",
  icon: new ImgIcon({ src: recieptEdit, alt: "Invoice" }),
});
const payroll = new SideBarItem({
  route: "#",
  label: "Payroll",
  icon: new ImgIcon({ src: houseIcon, alt: "Payroll" }),
});
const paymentLinks = new SideBarItem({
  route: routes.paymentLinks,
  label: "Payment Links",
  icon: new ImgIcon({ src: linkIcon, alt: "Payment Links" }),
});
const transfer = new SideBarItem({
  route: routes.transfer,
  label: "Transfers",
  icon: new ImgIcon({ src: moneySend, alt: "Transfers" }),
});
const payouts = new SideBarItem({
  route: "#",
  label: "Payouts",
  icon: new ImgIcon({ src: moneys, alt: "Payouts" }),
});
const cards = new SideBarItem({
  route: "#",
  label: "Cards",
  icon: new ImgIcon({ src: creditCard, alt: "Cards" }),
});
const profile = new SideBarItem({
  route: routes.profile,
  label: "Profile",
  icon: new ImgIcon({ src: settingicon, alt: "Profile" }),
});
const business = new SideBarItem({
  route: routes.business,
  label: "Business",
  icon: new ImgIcon({ src: houseIcon, alt: "Business" }),
});
const accounts = new SideBarItem({
  route: routes.accounts,
  label: "Accounts",
  icon: new ImgIcon({ src: bankNote2, alt: "Accounts" }),
});
const team = new SideBarItem({
  route: routes.team,
  label: "Team",
  icon: new ImgIcon({ src: users, alt: "Team" }),
});
const integrations = new SideBarItem({
  route: routes.integrations,
  label: "Integrations",
  icon: new ImgIcon({ src: codeSquare, alt: "Integrations" }),
});
const permissions = new SideBarItem({
  route: routes.permissions,
  label: "Permissions",
  icon: new ImgIcon({ src: shieldTick, alt: "Permissions" }),
});
const getStarted = new SideBarItem({
  route: routes.permissions,
  label: "Get Started",
  icon: new ImgIcon({ src: lifeBuoy, alt: "Get Started" }),
});
const reoccuring = new SideBarItem({
  route: routes.permissions,
  label: "Reoccurring",
  icon: new ImgIcon({ src: refresh, alt: "Reoccurring " }),
});
const auditLogs = new SideBarItem({
  route: routes.permissions,
  label: "Audit Logs ",
  icon: new ImgIcon({ src: eye, alt: "Audit Logs " }),
});
const dashboardSidebarItems: SideBarItem[] = [
  getStarted,
  home,
  payments,
  loans,
  marketPlace,
  reoccuring,
  fraudProtection,
  auditLogs,
  helpAndsupport,
  settings,
];
const othersSidebarItems: SideBarItem[] = [
  invoice,
  payroll,
  paymentLinks,
  transfer,
  payouts,
  cards,
];
const settingSidebarItems: SideBarItem[] = [
  profile,
  business,
  accounts,
  team,
  integrations,
  permissions,
];
const defaultSideBarItems: SideBarItem[] = [
  home,
  payments,
  credit,
  marketPlace,
  fraudProtection,
  helpAndsupport,
  settings,
];
export {
  dashboardSidebarItems,
  othersSidebarItems,
  settingSidebarItems,
  defaultSideBarItems,
};
