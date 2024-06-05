const apiEndpoints = {
  cookie: "/api/cookie",
  userSetUrl: "user",
  tokenSetUrl: "token",
  base: "https://api.airtimereport.com/api/",
  login: "auth/login",
  me: "me",
  transactionStats: "transaction-stats",
  transactionHistory: "history",
  generateAccount: "me/generate-account-number",
  creditHistory: "me/credit-history",
  exportTransaction: "export/transaction",
  users: "admin/users",
  creditUser: (id: number) => `admin/user/${id}/credit-balance`,
};
export const localApiEndPoints = {
  main: "/api",
  login: "/api/login",
  logout: "/api/logout",
};
export default apiEndpoints;
