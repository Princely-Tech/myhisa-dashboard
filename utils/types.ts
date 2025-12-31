import { ButtonProps } from "antd";
import { OverrideToken } from "antd/es/theme/interface";
import { MappingAlgorithm } from "antd/lib/theme";
import { AliasToken } from "antd/lib/theme/internal";
import { LinkProps } from "next/link";
type ComponentsConfig = {
  [key in keyof OverrideToken]?: OverrideToken[key] & {
    algorithm?: boolean | MappingAlgorithm | MappingAlgorithm[];
  };
};
interface CustomLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
  rippleProps?: RippleProps;
}
type TransactionItem = {
  transaction_id: string;
  amount: number;
  network: string;
  msisdn: string;
  type: string;
  external_ref: string;
  status: string;
  balance_before: number;
  commission_amount: number;
  created_at: string;
};
export type SummaryTotalItem = {
  user_id: number;
  user_name: string;
  network: string;
  type: string;
  channel: number;
  total_transactions: number;
  total_amount: number;
};
export type SummaryTotal = {
  data: SummaryTotalItem[];
  message: string;
};
export type SummaryUser = {
  data: SummaryUserItem[];
  message: string;
};
export type SummaryUserItem = {
  user_id: number;
  user_name: string;
  total_airtime_transactions: number;
  total_airtime_amount: number;
  total_data_transactions: number;
  total_data_amount: number;
  grand_total_transactions: number;
  grand_total_amount: number;
};
export type SummaryNetwork = {
  data: SummaryNetworkItem[];
  message: string;
};
export type SummaryNetworkItem = {
  network: string;
  channel: number;
  type: string;
  total_transactions: number;
  total_amount: number;
};
type TransactionHistory = {
  pagination: {
    current_page: number;
    next_page: number;
    next_page_url: string;
    prev_page: number;
    prev_page_url: string;
    total_pages: number;
  };
  records: TransactionItem[];
  total_records: number;
};
type CreditHistoryItem = {
  id: number;
  wallet_id: number;
  amount: number;
  action: string;
  provider: string;
  ref: string;
  description: string;
  balance_before: number;
  created_at: string;
  updated_at: string;
};
type CreditHistory = {
  pagination: {
    current_page: number;
    next_page: number;
    next_page_url: string;
    prev_page: number;
    prev_page_url: string;
    total_pages: number;
  };
  records: CreditHistoryItem[];
  total_records: number;
};

export interface WalletReconciliationItem {
  id: number;
  wallet_id: number;
  user_id: number;
  user: User;
  // user: {
  //   id: 8;
  //   name: "Thompson Onuoha";
  //   email: "thompsononuoha02@gmail.com";
  //   phone: "09015695508";
  //   email_verified_at: null;
  //   approved_at: null;
  //   rank: 0;
  //   reporting_emails: "";
  //   referral_code: "frRd7Xqt";
  //   created_at: "2024-05-28T19:06:36.349+01:00";
  //   wallet: {
  //     balance: 0;
  //     commission: 0;
  //     bonus: 0;
  //     account_number: null;
  //     account_name: null;
  //     bank_name: null;
  //     first_name: null;
  //     last_name: null;
  //     dob: null;
  //     formatted_dob: null;
  //   };
  //   low_balance_threshold: 0;
  // };
  reconciliation_date_str: string;
  reconciliation_date: string;
  opening_balance: number;
  closing_balance: number;
  current_balance: number;
  inflow: number;
  outflow: number;
  total_transaction_count: number;
  successful_transaction_count: number;
  created_at: string;
  updated_at: string;
}
export interface TelcoReconciliationItem {
  id: number;
  telco:string;
  channel: string;
  opening_balance: number;
  closing_balance: number;
  reconciliation_date:string;
  reconciliation_date_str:string;
  created_at: string;
  updated_at: string;
}
export interface TelcoReconciliationGet {
  data: TelcoReconciliationItem[];
  message: string;
}


export interface WalletReconciliationGet {
  data: WalletReconciliationItem[];
  message: string;
}

type UsersList = {
  pagination: {
    current_page: number;
    next_page: number;
    next_page_url: string;
    prev_page: number;
    prev_page_url: string;
    total_pages: number;
  };
  users: User[];
  total_users: number;
};
type TransactionStats = {
  date_from: string;
  date_to: string;
  failed: number;
  internal_error: number;
  invalid_amount: number;
  invalid_msisdn: number;
  others: number;
  pending: number;
  telco_error: number;
  total_successful: number;
  total_transactions: number;
  total_unsuccessful: number;
};
interface RippleProps {
  duration: number;
  color: string;
}
interface CustomButtonProps extends ButtonProps {
  rippleProps?: RippleProps | null;
  tokenConfig?: Partial<AliasToken>;
  componentConfig?: ComponentsConfig;
}
export interface CookieSetParams {
  cookie: string;
}
export type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  email_verified_at: string;
  approved_at: string;
  rank: 1;
  reporting_emails: string;
  referral_code: string;
  created_at: string;
  wallet: {
    balance: number;
    commission: number;
    bonus: number;
    account_number: null | number;
    account_name: null | string;
    bank_name: null | string;
  };
};
export interface QueryGetResponse {
  data: {
    telco_log: {
      error: string;
      response_http_code: number;
      response_status_code: string;
      response_transaction_id: string;
      status: string;
      transaction_id: string;
    };
    transaction: {
      transaction_id: string;
      amount: number;
      network: string;
      msisdn: string;
      type: string;
      external_ref: string;
      status: string;
      created_at: string;
    };
  };
  status: string;
}
export interface AdminCreditHistoryItem extends CreditHistoryItem {
  credited_by?: string;
}

export interface AdminCreditHistory {
  user: {
    id: number;
    name: string;
    email: string;
  };
  total_records: number;
  records: AdminCreditHistoryItem[];
  pagination: {
    current_page: number;
    total_pages: number;
    next_page: number;
    prev_page: number;
    next_page_url: string;
    prev_page_url: string;
  };
}

export interface AdminTransactionItem extends TransactionItem {
  user_id: number;
  user_name: string;
  user_email: string;
}

export interface AdminTransactionHistory {
  total_records: number;
  records: AdminTransactionItem[];
  pagination: {
    current_page: number;
    total_pages: number;
    next_page: number;
    prev_page: number;
    next_page_url: string;
    prev_page_url: string;
  };
}

export interface AdminCommissionSummaryItem {
  user_id: number;
  user_name: string;
  user_email: string;
  total_transactions: number;
  total_amount: number;
  total_commission: number;
  average_commission: number;
}

export interface AdminCommissionSummary {
  summaries: AdminCommissionSummaryItem[];
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

export interface AdminCommissionDetailItem {
  transaction_id: string;
  user_id: number;
  user_name: string;
  user_email: string;
  type: string;
  network: string;
  amount: number;
  commission_amount: number;
  status: string;
  created_at: string;
}

export interface AdminCommissionDetails {
  data: AdminCommissionDetailItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface AdminCommissionByBillerItem {
  biller: string;
  type: string;
  total_transactions: number;
  total_amount: number;
  total_commission: number;
  average_commission: number;
}

export interface AdminCommissionByBiller {
  summaries: AdminCommissionByBillerItem[];
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

export type {
  TransactionItem,
  CustomLinkProps,
  CustomButtonProps,
  RippleProps,
  TransactionStats,
  TransactionHistory,
  CreditHistory,
  CreditHistoryItem,
  UsersList,
};
