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
export type {
  TransactionItem,
  CustomLinkProps,
  CustomButtonProps,
  RippleProps,
  TransactionStats,
  TransactionHistory,
  CreditHistory,
  CreditHistoryItem,UsersList,
};
