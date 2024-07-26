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
  users: "/users",
};
export default routes;
export { transactionFilterStr };
