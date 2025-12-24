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
  walletReconciliation: "/wallet_reconcilation",
  users: "/users",
  queryPlain: "/transactions/query",
  query: (id: string) => `${routes.queryPlain}?id=${id}`,
  telcoReconciliation: "/reconciliation",
  commissionSummary: "/commission/summary",
  commissionDetails: "/commission/details",
  commissionByNetwork: "/commission/by-network",
};
export default routes;
export { transactionFilterStr };
