import { Metadata } from "next";

const metadata: Metadata = {
  title: "Paytegrate",
  description: "Paytegrate app",
};
const antdGlobalConfig = {
  fontFamily: `inherit`,
  colorBorder: '#D0D5DD',
  colorInputText: '#344054',
  colorTextPlaceholder: '#98A2B3',
}
const constants = {
  metadata,
  antdGlobalConfig,
  addRuleTypes: {
    authRules: "authRules",
    allowRules: "allowRules",
    blockedRules: "blockedRules",
    reviewRules: "reviewRules",
  },
};
export default constants;
