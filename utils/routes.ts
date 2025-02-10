const transactionFilterStr = {
  all: "All",
  today: "today",
  lastSevenDays: "lastSevenDays",
  lastThirtyDays: "lastThirtyDays",
};
const routes = {
  login: "/",
  dashboard: "/dashboard",
  transactions: "/transactions",
  summariesTotal: "/summaries_total",
  summariesUser: "/summaries_user",
  summariesNetwork: "/summaries_network",
  summariesChannel: "/summaries_channel",
  transactionStats: "/transaction_stats",
  creditHistory: "/credit-history",
  exportTransacton: "/export_transactions",
  walletReconcilation: "/wallet_reconcilation",
  users: "/users",
  queryPlain: "/transactions/query",
  query: (id: string) => `${routes.queryPlain}?id=${id}`,
  telcoReconcilation: "/telco_reconcilation",
};
export default routes;
export { transactionFilterStr };
