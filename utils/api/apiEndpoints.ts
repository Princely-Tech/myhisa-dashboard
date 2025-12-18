const apiEndpoints = {
  cookie: "/api/cookie",
  userSetUrl: "user",
  tokenSetUrl: "token",
  base: process.env.NEXT_PUBLIC_API_URL,
  login: "auth/login",
  me: "me",
  transactionStats: "transaction-stats",
  transactionHistory: "history",
  generateAccount: "me/generate-account-number",
  creditHistory: "me/credit-history",
  walletReconciliation: "admin/reports/wallet-reconciliations",
  exportTransaction: "export/transaction",
  users: "admin/users",
  creditUser: (id: number) => `admin/user/${id}/credit-balance`,
  summariesTotal: "admin/reports/transaction-summary",
  summariesUser: "admin/reports/user-transactions",
  summariesNetwork: "admin/reports/network-transactions",
  summariesChannel: "admin/reports/channel-transactions",
  transactionQuery: (id: string) => `transaction/${id}`,
  telcoReconciliation: "admin/reports/telco-reconciliations",
};
export const localApiEndPoints = {
  main: "/api",
  login: "/api/login",
  logout: "/api/logout",
};
export default apiEndpoints;
