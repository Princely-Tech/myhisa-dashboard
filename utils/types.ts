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
  token: string;
  commission_amount: number;
  created_at: string;
  beneficiary_name: string;
  ref_to_telco: string;
  retry_refs_to_telco: string;
  channel: string;
  connection: number;
  paid_from_wallet: "balance" | "commission";
  response_transaction_id: string | null;
  // Customer's address (electricity/cable). Blank for services that don't collect one.
  beneficiary_details?: string | null;
  // Units vended, e.g. "12.5 kWh" (electricity).
  unit?: string | null;
  // Re-used per service: meter type ("Prepaid"/"Postpaid") for electricity,
  // data plan description for Data, cable package name for Cable.
  data_bundle_desc?: string | null;
  data_bundle_code?: string | null;
  // Set once the debit was refunded to the wallet (status keeps its value).
  refunded_at?: string | null;
  // Further fields the Go API serialises on models.Transaction (optional:
  // older responses/fixtures may not carry them).
  status_code?: string | null;
  remark?: string | null;
  fee?: number | null;
  balance_after?: number | null;
  // When the wallet was debited / the (current) attempt was sent to the provider.
  billed_at?: string | null;
  attempt_sent_at?: string | null;
  reconciled_at?: string | null;
  retry_of_transaction_id?: string | null;
  // Vend instructions returned by some billers (electricity).
  instruction?: string | null;
};

// models.TransactionTelcoLog as returned in full by
// self-service/transactions/by-refs (TransactionDetails returns a subset
// without timestamps).
export type TransactionTelcoLog = {
  transaction_id: string;
  status: string | null;
  response_transaction_id?: string | null;
  response_http_code?: number;
  response_status_code?: string | null;
  response_message?: string | null;
  error?: string | null;
  connection?: number;
  created_at?: string | null;
  updated_at?: string | null;
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
export interface SubLoginInfo {
  id: number;
  name: string;
  email: string;
  permissions: string[];
}

// Matches partnerConstants.Bank / partnerConstants.NonBank on the backend.
export type PartnerType = "bank" | "non_bank";

export type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  email_verified_at: string | null;
  approved_at: string | null;
  rank: number; // 0 = user, 1 = staff (permission-scoped), 2 = super admin
  permissions?: string[];
  // Present only when the current session is a sub-login (see
  // utils/accountPermissions.ts) - absent/null means this is the primary
  // account owner's own session. Unrelated to rank/permissions above, which
  // are the internal staff/admin RBAC system.
  sub_login?: SubLoginInfo | null;
  reporting_emails: string;
  referral_code: string;
  created_at: string;
  // Partner onboarding/KYC details. Optional/nullable throughout - accounts
  // registered before this was added simply don't have these set.
  rc_number?: string | null;
  contact_person_name?: string | null;
  contact_person_designation?: string | null;
  contact_person_phone?: string | null;
  contact_person_email?: string | null;
  bvn?: string | null;
  nin?: string | null;
  partner_type?: PartnerType | null;
  cac_certificate_uploaded_at?: string | null;
  utility_bill_uploaded_at?: string | null;
  // Set by an admin while the account is pending, asking the partner to
  // clarify/fix something. Never present once approved_at is set - the
  // backend strips it from this user's own responses at that point.
  registration_query?: string | null;
  registration_query_at?: string | null;
  // Kobo. 0 (or absent) = low-balance alerts off. Serialised by /me.
  low_balance_threshold?: number | null;
  // API-key IP whitelist entries (IPs / CIDRs); empty = any IP. /me includes
  // it on the onboarding-v2 backend.
  ip_whitelist?: string[] | null;
  // Onboarding v2. Absent on an older backend - callers then fall back to
  // the legacy approved_at / email_verified_at checks.
  onboarding_status?: OnboardingStatus | "" | null;
  onboarding_flow?: OnboardingFlow | "" | null;
  onboarding_submitted_at?: string | null;
  business_type?: BusinessType | null;
  trading_name?: string | null;
  partner_category?: PartnerCategory | null;
  signatory_name?: string | null;
  rejection_reason?: string | null;
  reapply_after?: string | null;
  // Whether the account has an API key and its last 4 characters. /me never
  // includes the key itself. Absent on backends older than onboarding-v2.
  has_api_key?: boolean;
  api_key_last4?: string;
  wallet: {
    balance: number;
    commission: number;
    bonus: number;
    account_number: null | number;
    account_name: null | string;
    bank_name: null | string;
    is_account_active: boolean;
    block_reason?: string | null;
    blocked_at?: string | null;
  };
};
// ---------------------------------------------------------------------------
// Onboarding v2 (hisa_go_api docs/ONBOARDING_V2_API.md, models/onboarding.go,
// services/onboarding/view.go). Field names match the API exactly.
// ---------------------------------------------------------------------------

export type OnboardingStatus =
  | "email_unverified"
  | "profile_incomplete"
  | "submitted"
  | "in_review"
  | "queried"
  | "approved"
  | "rejected"
  | "suspended";

export type OnboardingFlow = "legacy" | "v2";
export type BusinessType = "RC" | "BN" | "IT";
export type PartnerCategory = "bank" | "mfb" | "fintech" | "aggregator" | "reseller" | "merchant" | "other";
export type ServiceOfInterest =
  | "airtime"
  | "data"
  | "electricity"
  | "cable_tv"
  | "betting"
  | "exam_pins"
  | "internet"
  | "bulk_airtime"
  | "vouchers";
export type VolumeBand = "under_1m" | "1m_10m" | "10m_50m" | "50m_200m" | "over_200m";
export type IntegrationMethod = "api" | "dashboard" | "both";
export type KycDocumentType =
  | "cac_certificate"
  | "cac_status_report"
  | "proof_of_address"
  | "cbn_licence"
  | "director_id";
/** "missing" = not uploaded (onboarding view only). */
export type KycDocumentStatus = "missing" | "uploaded" | "accepted" | "flagged";
export type KycCheckStatus = "passed" | "failed" | "pending" | "error";
export type IdentityMatch = "match" | "mismatch" | "unverified";

export interface OnboardingSteps {
  account_created: boolean;
  email_verified: boolean;
  business: boolean;
  cac: boolean;
  signatory: boolean;
  identity: boolean;
  documents: boolean;
  ready_to_submit: boolean;
  submitted: boolean;
  approved: boolean;
  funding_account: boolean;
}

export interface OnboardingBusiness {
  name: string;
  business_type: BusinessType | null;
  rc_number: string | null;
  trading_name: string | null;
  partner_category: PartnerCategory | null;
  services_of_interest: ServiceOfInterest[];
  expected_volume_band: VolumeBand | null;
  integration_method: IntegrationMethod | null;
  address_line: string | null;
  address_state: string | null;
  address_lga: string | null;
  website: string | null;
  cac_verified_at: string | null;
  cac_registered_name: string | null;
  cac_registered_address: string | null;
}

export interface OnboardingSignatory {
  name: string | null;
  role: string | null;
  phone: string | null;
  email: string | null;
  dob: string | null;
  /** Masked to the last 4 digits ("****1234"). */
  bvn: string | null;
  nin: string | null;
  identity_verified_at: string | null;
  identity_match: IdentityMatch | null;
}

export interface OnboardingDocument {
  type: KycDocumentType;
  required: boolean;
  status: KycDocumentStatus;
  uploaded_at: string | null;
  reviewed_at: string | null;
  reviewer_note: string | null;
}

export interface OnboardingCheck {
  status: KycCheckStatus;
  provider: string;
  match_score: number | null;
  created_at: string;
  /** Partner view: masked summary. Admin view: the full stored result. */
  summary: Record<string, unknown>;
}

export interface OnboardingQuery {
  note: string;
  fields: string[];
  documents: string[];
  /** Go zero time ("0001-01-01T00:00:00Z") for a legacy query without a date. */
  created_at: string;
  queried_by?: number;
  reply: string | null;
  replied_at: string | null;
}

export interface OnboardingRejection {
  reason: string | null;
  reapply_after: string | null;
  can_reapply: boolean;
}

/** GET /me/onboarding `data` (and the onboarding part of the admin detail). */
export interface OnboardingView {
  status: OnboardingStatus;
  flow: OnboardingFlow | "";
  submitted_at: string | null;
  approved_at: string | null;
  steps: OnboardingSteps;
  account: {
    email: string;
    phone: string | null;
    email_verified_at: string | null;
    terms_version: string | null;
    terms_accepted_at: string | null;
  };
  business: OnboardingBusiness;
  signatory: OnboardingSignatory;
  documents: OnboardingDocument[];
  required_documents: KycDocumentType[];
  checks: { cac: OnboardingCheck | null; bvn: OnboardingCheck | null; nin: OnboardingCheck | null };
  open_query: OnboardingQuery | null;
  query_history: OnboardingQuery[];
  rejection: OnboardingRejection | null;
  /** Keys still blocking submission (e.g. "rc_number", "cac", "documents.proof_of_address"). */
  missing: string[];
  missing_details: Record<string, string[]>;
  editable_fields: string[];
  editable_documents: KycDocumentType[];
}

/** POST /me/onboarding/verify-cac `verification`. */
export interface CacVerification {
  status: KycCheckStatus;
  rc_number: string;
  business_type: BusinessType;
  company_name?: string;
  company_status?: string;
  address?: string;
  affiliates?: { name: string; role: string }[];
  message: string;
}

export interface IdentityPartResult {
  status: KycCheckStatus;
  name: string;
  message: string;
  bvn?: string;
  nin?: string;
}

/** POST /me/onboarding/verify-identity `verification`. */
export interface IdentityVerification {
  bvn: IdentityPartResult;
  nin: IdentityPartResult;
  identity_match: IdentityMatch;
  signatory_match: boolean | null;
  nin_match: boolean | null;
  affiliate_match: boolean | null;
  dob_match: boolean | null;
}

export interface FundingAccountResult {
  created: boolean;
  message?: string;
  account_number?: string;
  account_name?: string;
  bank_name?: string;
}

export interface OnboardingEvent {
  id: number;
  user_id: number;
  from_status: OnboardingStatus | "";
  to_status: OnboardingStatus;
  actor_id: number | null;
  note: string | null;
  created_at: string;
}

/** GET /admin/onboarding/:userID `data`. */
export interface AdminOnboardingDetail extends OnboardingView {
  events: OnboardingEvent[];
  legacy: {
    partner_type: PartnerType | null;
    contact_person_name: string | null;
    contact_person_designation: string | null;
    contact_person_phone: string | null;
    contact_person_email: string | null;
    cac_certificate_uploaded_at: string | null;
    utility_bill_uploaded_at: string | null;
    registration_query: string | null;
    registration_query_at: string | null;
  };
  /** doc type (or legacy_cac_certificate / legacy_utility_bill) -> "/api/admin/user/:id/document/:type". */
  document_urls: Record<string, string>;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    created_at: string;
    ban_code: number;
  };
}

export interface AdminOnboardingQueueItem {
  user_id: number;
  name: string;
  trading_name: string | null;
  email: string;
  phone: string | null;
  onboarding_status: OnboardingStatus;
  flow: OnboardingFlow | "";
  partner_category: PartnerCategory | null;
  partner_type: PartnerType | null;
  business_type: BusinessType | null;
  rc_number: string | null;
  /** Not returned by the queue endpoint today; shown when present. */
  expected_volume_band?: VolumeBand | null;
  submitted_at: string | null;
  waiting_seconds: number;
  waiting: string;
  cac_verified_at: string | null;
  identity_match: IdentityMatch | null;
  checks: Record<"cac" | "bvn" | "nin", { status: KycCheckStatus; checked_at: string } | null>;
  documents: { type: KycDocumentType; status: KycDocumentStatus; uploaded_at: string; url: string }[];
  missing_documents: KycDocumentType[];
  needs_attention: string[];
  legacy_documents: {
    cac_certificate_uploaded_at: string | null;
    utility_bill_uploaded_at: string | null;
  };
}

export interface AdminOnboardingQueue {
  total: number;
  items: AdminOnboardingQueueItem[];
  pagination: { current_page: number; per_page: number; total_pages: number };
}

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
      // Electricity vend details (QueryBody shows them when present).
      token?: string;
      beneficiary_name?: string | null;
      beneficiary_details?: string | null;
      unit?: string | null;
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

export interface AvailabilityItem {
  service: string;
  provider: string;
  percent: number;
}

export interface AvailabilityResponse {
  count?: number;
  data: AvailabilityItem[];
}

export interface WebhookItem {
  id: number;
  user_id: number;
  webhook_url: string;
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface WebhookResponse {
  data: WebhookItem[] | WebhookItem;
}

/** GET/PUT me/settings `data`. */
export interface PartnerSettings {
  /** Kobo; 0 = low-balance alert off. */
  low_balance_threshold: number;
  /** Canonical IPs / CIDRs; [] = no whitelist (any IP may use the API key). */
  ip_whitelist: string[];
}

export interface PartnerSettingsResponse {
  message?: string;
  data: PartnerSettings;
}

/** POST webhooks/:id/test `data` (a failed delivery still answers 200). */
export interface WebhookTestResult {
  delivery_id: number;
  status: string; // success | failed | skipped
  success: boolean;
  response_code: number;
  response_body: string;
  error_message: string;
  webhook: { id: number; url: string };
}

/** GET me/api-key, POST me/api-key/reveal and POST me/refresh-api-key `data`. */
export interface ApiKeyResponse {
  message?: string;
  data: { api_key: string };
}

export interface WebhookDeliveryItem {
  id: number;
  partner_webhook_id: number;
  event_id: number;
  status: string;
  response_code: number;
  response_body: string;
  error_message: string;
  attempt_count: number;
  created_at: string;
  event: {
    service: string;
    provider: string;
    event_type: string;
    previous_state: number;
    new_state: number;
  };
}

export interface WebhookDeliveryResponse {
  data: WebhookDeliveryItem[];
}

export interface AdminWebhookDeliveryItem extends WebhookDeliveryItem {
  user_email: string;
  user_id: number;
  webhook_url: string;
}

export interface AdminWebhookDeliveryResponse {
  data: AdminWebhookDeliveryItem[];
  pagination?: {
    current_page: number;
    total_pages: number;
    total_records: number;
  };
}

export interface BulkCampaignItem {
  id: number;
  campaign_id: string;
  row_number: number;
  sn: string;
  name: string;
  phone: string;
  amount: number;
  network: string;
  message: string;
  status: string;
  transaction_id?: string;
  sms_transaction_id?: string;
  processed_at?: string;
  RowNumber?: number;
  SN?: string;
  Name?: string;
  Phone?: string;
  Amount?: number;
  Network?: string;
  Message?: string;
}

export interface BulkCampaign {
  id: number;
  campaign_id: string;
  user_id: number;
  file_name: string;
  file_hash: string;
  total_rows: number;
  total_amount: number;
  total_sms_cost: number;
  message_template: string;
  status: string;
  status_code: string;
  processed_count: number;
  success_count: number;
  failed_count: number;
  otp_verified_at?: string;
  otp_expires_at?: string;
  amount_debited: number;
  balance_before: number;
  started_at?: string;
  completed_at?: string;
  paused_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BulkUploadResponse {
  message: string;
  campaign_id: string;
  summary: {
    total_rows: number;
    total_amount: number;
    total_amount_kobo: number;
    total_sms_cost: number;
    total_cost: number;
    message_template: string;
  };
  preview: BulkCampaignItem[];
  next_step: string;
  warning?: string;
  duplicate_info?: {
    file_name: string;
    uploaded_at: string;
    total_rows: number;
  };
}

export interface BulkCampaignStatusResponse {
  campaign: BulkCampaign;
  summary: {
    total_items: number;
    processed_count: number;
    success_count: number;
    failed_count: number;
    pending_count: number;
  };
  items: BulkCampaignItem[];
  pagination: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface BulkCampaignsListResponse {
  data: BulkCampaign[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface SenderID {
  id: number;
  user_id: number;
  sender_id: string;
  type: "transactional" | "promotional";
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface SenderIDListResponse {
  sender_ids: SenderID[];
  total: number;
}

export interface SenderIDResponse {
  message: string;
  sender_id: SenderID;
}

export interface AdminAuditLog {
  id: number;
  admin_user_id: number;
  admin_name: string;
  admin_email: string;
  admin_rank: number;
  auth_type: string;
  action: string;
  entity_type: string;
  entity_id: string;
  permission_used: string;
  action_label: string;
  target_user_id: number | null;
  method: string;
  path: string;
  route: string;
  query_params: string;
  route_params: string;
  ip_address: string;
  user_agent: string;
  request_body: string;
  response_body: string | null;
  status_code: number;
  latency_ms: number;
  reason: string | null;
  metadata: string | null;
  created_at: string;
}

export interface Permission {
  key: string;
  label: string;
  category: string;
  description: string;
}

export interface StaffUser {
  id: number;
  name: string;
  email: string;
  rank: number;
  permissions: string[];
}

// AccountPermission is the tenant/self-service permission catalog entry -
// separate from Permission above, which is the internal staff/admin RBAC
// catalog.
export interface AccountPermission {
  key: string;
  label: string;
  category: string;
  description: string;
}

export interface SubLogin {
  id: number;
  name: string;
  email: string;
  permissions: string[];
  created_at: string;
}

export interface AdminAuditLogsResponse {
  message: string;
  data: {
    logs: AdminAuditLog[];
    pagination: {
      current_page: number;
      per_page: number;
      total_pages: number;
      total_records: number;
    };
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
