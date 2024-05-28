const apiEndpoints = {
  tokenSetUrl: "token",
  base: "https://api.airtimereport.com/api/",
  login: "auth/login",
  me: "me",
  transactionStats: "transaction-stats",
  transactionHistory: "history",
  generateAccount:'me/generate-account-number',
  creditHistory:'me/credit-history',
  exportTransaction: 'export/transaction'
};
export const localApiEndPoints = {
  main: "/api",
  login: "/api/login",
  logout: "/api/logout",
};
export default apiEndpoints;
