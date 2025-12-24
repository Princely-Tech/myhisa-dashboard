export const TRANSACTION_TYPES = [
  { value: 'Airtime', label: 'Airtime' },
  { value: 'Data', label: 'Data' },
  { value: 'Gift-Data', label: 'Gift Data' },
  { value: 'Cable', label: 'Cable TV' },
  { value: 'Electricity', label: 'Electricity' },
];

export const CHART_COLORS = {
  'Airtime': '#0088FE',
  'Data': '#00C49F',
  'Cable': '#FFBB28',
  'Electricity': '#FF8042',
  'Gift-Data': '#8884D8',
};

export function formatCurrency(kobo: number): string {
  const naira = kobo / 100;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(naira);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-NG').format(num);
}

export function koboToNaira(kobo: number): number {
  return kobo / 100;
}

export interface CommissionSummaryItem {
  type: string;
  total_transactions: number;
  total_amount: number;
  total_commission: number;
  average_commission: number;
}

export interface CommissionSummaryData {
  summaries: CommissionSummaryItem[];
  totals: {
    total_transactions: number;
    total_amount: number;
    total_commission: number;
  };
  period: {
    from: string;
    to: string;
  };
}

export interface CommissionDetailItem {
  transaction_id: string;
  type: string;
  network: string;
  amount: number;
  commission_amount: number;
  status: string;
  created_at: string;
}

export interface CommissionDetailsData {
  data: CommissionDetailItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface CommissionByNetworkItem {
  type: string;
  network: string;
  total_transactions: number;
  total_amount: number;
  total_commission: number;
  average_commission: number;
}

export interface CommissionByNetworkData {
  data: CommissionByNetworkItem[];
  period: {
    from: string;
    to: string;
  };
}
