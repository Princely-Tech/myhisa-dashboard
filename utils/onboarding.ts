// Onboarding v2 rules shared by the wizard, the status page, the admin queue
// and the edge middleware. Pure module (no browser globals, no React) so it
// is safe in middleware.ts. Allowed values mirror hisa_go_api
// services/onboarding/rules.go and models/onboarding.go.
import routes from "./routes";
import type {
  BusinessType,
  IntegrationMethod,
  KycDocumentType,
  OnboardingStatus,
  OnboardingView,
  PartnerCategory,
  ServiceOfInterest,
  User,
  VolumeBand,
} from "./types";

/** Sent as terms_version on POST /auth/signup. Bump when the terms change. */
export const TERMS_VERSION = "2026-10";

// ---------------------------------------------------------------------------
// Allowed values + labels
// ---------------------------------------------------------------------------

export const ONBOARDING_STATUSES: OnboardingStatus[] = [
  "email_unverified",
  "profile_incomplete",
  "submitted",
  "in_review",
  "queried",
  "approved",
  "rejected",
  "suspended",
];

export const STATUS_LABELS: Record<OnboardingStatus, string> = {
  email_unverified: "Email not verified",
  profile_incomplete: "In progress",
  submitted: "Submitted",
  in_review: "In review",
  queried: "Queried",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
};

export const BUSINESS_TYPES: { value: BusinessType; label: string; hint: string }[] = [
  { value: "RC", label: "Limited company (RC)", hint: "Registered company, e.g. RC1234567" },
  { value: "BN", label: "Business name (BN)", hint: "Registered business name, e.g. BN1234567" },
  { value: "IT", label: "Incorporated trustees (IT)", hint: "NGO, association or trust, e.g. IT123456" },
];

export const PARTNER_CATEGORIES: { value: PartnerCategory; label: string }[] = [
  { value: "bank", label: "Commercial bank" },
  { value: "mfb", label: "Microfinance bank" },
  { value: "fintech", label: "Fintech or app" },
  { value: "aggregator", label: "Aggregator" },
  { value: "reseller", label: "Reseller or agent network" },
  { value: "merchant", label: "Merchant or retailer" },
  { value: "other", label: "Other" },
];

export const SERVICES: { value: ServiceOfInterest; label: string }[] = [
  { value: "airtime", label: "Airtime" },
  { value: "data", label: "Data" },
  { value: "electricity", label: "Electricity" },
  { value: "cable_tv", label: "Cable TV" },
  { value: "betting", label: "Betting" },
  { value: "exam_pins", label: "Exam PINs" },
  { value: "internet", label: "Internet (Spectranet, Smile)" },
  { value: "bulk_airtime", label: "Bulk airtime" },
  { value: "vouchers", label: "Vouchers" },
];

export const VOLUME_BANDS: { value: VolumeBand; label: string }[] = [
  { value: "under_1m", label: "Under ₦1m a month" },
  { value: "1m_10m", label: "₦1m to ₦10m a month" },
  { value: "10m_50m", label: "₦10m to ₦50m a month" },
  { value: "50m_200m", label: "₦50m to ₦200m a month" },
  { value: "over_200m", label: "Over ₦200m a month" },
];

export const INTEGRATION_METHODS: { value: IntegrationMethod; label: string; hint: string }[] = [
  { value: "api", label: "API", hint: "Your systems call our API" },
  { value: "dashboard", label: "Dashboard", hint: "Your team uses this dashboard" },
  { value: "both", label: "Both", hint: "API plus dashboard" },
];

export const DOCUMENT_TYPES: KycDocumentType[] = [
  "cac_certificate",
  "cac_status_report",
  "proof_of_address",
  "cbn_licence",
  "director_id",
];

export const DOCUMENT_LABELS: Record<KycDocumentType, { label: string; hint: string }> = {
  cac_certificate: { label: "CAC certificate", hint: "Certificate of incorporation or registration" },
  cac_status_report: { label: "CAC status report", hint: "Recent status report showing directors" },
  proof_of_address: { label: "Proof of address", hint: "Utility bill dated within 3 months" },
  cbn_licence: { label: "CBN licence", hint: "Operating licence issued by the CBN" },
  director_id: { label: "Director's ID", hint: "Passport, driver's licence or voter's card" },
};

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
  "Yobe", "Zamfara",
];

/** Query field keys the admin can name (QueryableFields in rules.go). */
export const QUERYABLE_FIELDS: { value: string; label: string; step: "business" | "identity" }[] = [
  { value: "business_type", label: "Business type", step: "business" },
  { value: "rc_number", label: "CAC number", step: "business" },
  { value: "trading_name", label: "Trading name", step: "business" },
  { value: "partner_category", label: "Partner category", step: "business" },
  { value: "services_of_interest", label: "Services of interest", step: "business" },
  { value: "expected_volume_band", label: "Expected monthly volume", step: "business" },
  { value: "integration_method", label: "Integration method", step: "business" },
  { value: "address", label: "Address (all lines)", step: "business" },
  { value: "address_line", label: "Street address", step: "business" },
  { value: "address_state", label: "State", step: "business" },
  { value: "address_lga", label: "LGA", step: "business" },
  { value: "website", label: "Website", step: "business" },
  { value: "signatory_name", label: "Signatory name", step: "identity" },
  { value: "signatory_role", label: "Signatory role", step: "identity" },
  { value: "signatory_phone", label: "Signatory phone", step: "identity" },
  { value: "signatory_email", label: "Signatory email", step: "identity" },
  { value: "signatory_dob", label: "Signatory date of birth", step: "identity" },
  { value: "bvn", label: "BVN", step: "identity" },
  { value: "nin", label: "NIN", step: "identity" },
];

export function fieldLabel(key: string): string {
  if (key.startsWith("documents.")) {
    const t = key.slice("documents.".length) as KycDocumentType;
    return DOCUMENT_LABELS[t]?.label ?? t.replace(/_/g, " ");
  }
  if (key === "cac") return "CAC verification";
  if (key === "identity") return "BVN and NIN check";
  if (key === "declaration") return "Declaration";
  const f = QUERYABLE_FIELDS.find((q) => q.value === key);
  if (f) return f.label;
  const doc = DOCUMENT_LABELS[key as KycDocumentType];
  if (doc) return doc.label;
  return key.replace(/_/g, " ");
}

export function labelOf<T extends string>(list: { value: T; label: string }[], v: T | null | undefined): string {
  if (!v) return "";
  return list.find((x) => x.value === v)?.label ?? v;
}

// ---------------------------------------------------------------------------
// Validation mirrors
// ---------------------------------------------------------------------------

// Letter test close to Go's unicode.IsLetter without ES2018 regex flags
// (tsconfig targets es5): any character with distinct cases, or A-Z.
function hasLetter(p: string): boolean {
  return Array.from(p).some((c) => /[A-Za-z]/.test(c) || c.toLowerCase() !== c.toUpperCase());
}
const hasDigit = (p: string) => /[0-9]/.test(p);
const hasSymbol = (p: string) => Array.from(p).some((c) => !/[0-9A-Za-z]/.test(c) && c.toLowerCase() === c.toUpperCase());

/** helper.ValidateV2Password: >= 10 chars, a letter and a digit, <= 72 bytes. */
export function passwordProblem(p: string): string | null {
  if (Array.from(p).length < 10) return "Use at least 10 characters";
  if (typeof TextEncoder !== "undefined" && new TextEncoder().encode(p).length > 72) {
    return "Use at most 72 characters";
  }
  if (!hasLetter(p) || !hasDigit(p)) return "Include at least one letter and one number";
  return null;
}

/** 0-4 for the strength meter. Below 2 never passes the backend rule. */
export function passwordScore(p: string): number {
  if (!p) return 0;
  let score = 0;
  if (Array.from(p).length >= 10) score++;
  if (hasLetter(p) && hasDigit(p)) score++;
  if (score === 2 && ((/[a-z]/.test(p) && /[A-Z]/.test(p)) || hasSymbol(p))) score++;
  if (score === 3 && Array.from(p).length >= 14) score++;
  return score;
}

/**
 * Local Nigerian number (with or without the leading 0, spaces allowed) ->
 * "+2348031234567", the format the backend stores and accepts. null if it
 * isn't 10 digits after the optional 0 / 234 prefix.
 */
export function toE164NG(input: string): string | null {
  let d = input.replace(/[^\d]/g, "");
  if (d.startsWith("234")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  if (!/^[789]\d{9}$/.test(d)) return null;
  return `+234${d}`;
}

/** "+2348031234567" -> "803 123 4567" for the +234-prefixed input. */
export function nationalPart(e164: string | null | undefined): string {
  if (!e164) return "";
  let d = e164.replace(/[^\d]/g, "");
  if (d.startsWith("234")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  if (d.length !== 10) return d;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

export const isEmail = (v: string) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v.trim());

/** Accept documents: PDF/JPG/PNG up to 5 MB (kycdocs.MaxFileSize). */
export const DOC_MAX_BYTES = 5 * 1024 * 1024;
export const DOC_ACCEPT = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

export function documentFileProblem(file: { name: string; type: string; size: number }): string | null {
  const okType =
    ["application/pdf", "image/jpeg", "image/png"].includes(file.type) ||
    /\.(pdf|jpe?g|png)$/i.test(file.name);
  if (!okType) return "Upload a PDF, JPG or PNG file";
  if (file.size > DOC_MAX_BYTES) return "The file must be 5 MB or smaller";
  if (file.size === 0) return "The file is empty";
  return null;
}

// ---------------------------------------------------------------------------
// Editing rules (rules.go CanEditField / CanEditDocument). The backend sends
// editable_fields / editable_documents already expanded, so these just read
// them.
// ---------------------------------------------------------------------------

export function canEditField(view: OnboardingView | null, field: string): boolean {
  if (!view) return false;
  return view.editable_fields.includes(field);
}

export function canEditDocument(view: OnboardingView | null, type: KycDocumentType): boolean {
  if (!view) return false;
  return view.editable_documents.includes(type);
}

export const BUSINESS_FIELDS = [
  "business_type",
  "rc_number",
  "trading_name",
  "partner_category",
  "services_of_interest",
  "expected_volume_band",
  "integration_method",
  "address_line",
  "address_state",
  "address_lga",
  "website",
] as const;

export const SIGNATORY_FIELDS = [
  "signatory_name",
  "signatory_role",
  "signatory_phone",
  "signatory_email",
  "signatory_dob",
] as const;

/** Which wizard step a missing/locked/error key belongs to. */
export function stepForKey(key: string): "business" | "identity" | "review" {
  if (key === "cac" || (BUSINESS_FIELDS as readonly string[]).includes(key) || key === "address") return "business";
  if (
    key === "identity" ||
    key === "bvn" ||
    key === "nin" ||
    key === "dob" ||
    key.startsWith("signatory_") ||
    key.startsWith("documents.") ||
    key === "file" ||
    (DOCUMENT_TYPES as string[]).includes(key)
  ) {
    return "identity";
  }
  return "review";
}

export function routeForStep(step: "business" | "identity" | "review"): string {
  if (step === "business") return routes.onboardingBusiness;
  if (step === "identity") return routes.onboardingIdentity;
  return routes.onboardingReview;
}

/** First wizard step that still needs work (profile_incomplete). */
export function firstIncompleteStep(view: OnboardingView): string {
  const s = view.steps;
  if (!s.business || !s.cac) return routes.onboardingBusiness;
  if (!s.signatory || !s.identity || !s.documents) return routes.onboardingIdentity;
  return routes.onboardingReview;
}

// ---------------------------------------------------------------------------
// Routing by onboarding status
// ---------------------------------------------------------------------------

export function onboardingStatusOf(user: User | null | undefined): OnboardingStatus | null {
  const s = user?.onboarding_status;
  return s && (ONBOARDING_STATUSES as string[]).includes(s) ? (s as OnboardingStatus) : null;
}

export function isLegacyFlow(user: User | null | undefined): boolean {
  return user?.onboarding_flow !== "v2";
}

/** Staff/admin accounts are never held in onboarding. */
export function isStaff(user: User | null | undefined): boolean {
  return !!user && user.rank >= 1;
}

/**
 * Where a signed-in, email-verified user belongs. Returns null when the
 * status is unknown (old backend): the caller then keeps the legacy
 * approved_at-based behaviour.
 */
export function onboardingHome(user: User | null | undefined): string | null {
  const status = onboardingStatusOf(user);
  if (!status) return null;
  if (isStaff(user)) return routes.dashboard;
  switch (status) {
    case "email_unverified":
      return routes.verifyEmail;
    case "profile_incomplete":
      return routes.onboarding;
    case "queried":
      // A v2 query is answered from the status page (Fix -> wizard -> Reply);
      // a legacy query also lands there and links to /profile.
      return routes.onboardingStatus;
    case "submitted":
    case "in_review":
    case "rejected":
      return routes.onboardingStatus;
    default:
      // approved, suspended
      return routes.dashboard;
  }
}

/** Route after a successful login / email verification. */
export function routeAfterAuth(user: User | null | undefined, needsVerification: boolean): string {
  if (needsVerification || (user && !user.email_verified_at)) {
    return `${routes.verifyEmail}?email=${encodeURIComponent(user?.email ?? "")}`;
  }
  return onboardingHome(user) ?? routes.dashboard;
}

/** Pages a not-yet-approved partner may still open. */
export function onboardingAllowedPaths(user: User | null | undefined, extra: string[]): string[] | null {
  const status = onboardingStatusOf(user);
  if (!status || isStaff(user)) return null; // no restriction
  const always = [routes.documentation, ...extra];
  switch (status) {
    case "profile_incomplete":
      return [routes.onboarding, routes.onboardingBusiness, routes.onboardingIdentity, routes.onboardingReview, routes.onboardingStatus, ...always];
    case "queried":
      return isLegacyFlow(user)
        ? [routes.onboarding, routes.onboardingStatus, routes.profile, ...always]
        : [routes.onboarding, routes.onboardingBusiness, routes.onboardingIdentity, routes.onboardingReview, routes.onboardingStatus, ...always];
    case "submitted":
    case "in_review":
      return isLegacyFlow(user)
        ? [routes.onboarding, routes.onboardingStatus, routes.profile, ...always]
        : [routes.onboarding, routes.onboardingStatus, ...always];
    case "rejected":
      return [routes.onboarding, routes.onboardingStatus, ...always];
    default:
      return null;
  }
}

/** True for a Go zero time or an empty value. */
export function isBlankTime(t: string | null | undefined): boolean {
  return !t || t.startsWith("0001-01-01");
}
