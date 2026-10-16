// Thin client for the onboarding v2 endpoints. Unlike AxiosHandler it never
// shows toasts itself: the onboarding screens render errors inline (field
// errors, lockout countdowns, locked fields), so callers get a typed
// ApiError instead. A 401 still ends the session like every other client.
import axios, { AxiosProgressEvent } from "axios";
import apiEndpoints from "./apiEndpoints";
import { forceReLogin, storeUser } from "../session";
import type {
  AdminOnboardingDetail,
  AdminOnboardingQueue,
  CacVerification,
  FundingAccountResult,
  IdentityVerification,
  KycDocumentType,
  OnboardingView,
  User,
} from "../types";

export class ApiError extends Error {
  status: number;
  /** Field -> messages (422). */
  errors: Record<string, string[]>;
  retryAfterSeconds: number | null;
  attemptsRemaining: number | null;
  lockedFields: string[];
  lockedDocuments: string[];
  onboardingStatus: string | null;
  /** Raw response body (some endpoints add data/verification to errors). */
  body: Record<string, unknown>;

  constructor(status: number, body: Record<string, unknown>, fallback: string) {
    const msg =
      (typeof body.message === "string" && body.message) ||
      (typeof body.error === "string" && body.error) ||
      fallback;
    super(msg);
    this.status = status;
    this.body = body;
    this.errors = (body.errors as Record<string, string[]>) ?? {};
    this.retryAfterSeconds = typeof body.retry_after_seconds === "number" ? body.retry_after_seconds : null;
    this.attemptsRemaining = typeof body.attempts_remaining === "number" ? body.attempts_remaining : null;
    this.lockedFields = Array.isArray(body.locked_fields) ? (body.locked_fields as string[]) : [];
    this.lockedDocuments = Array.isArray(body.locked_documents) ? (body.locked_documents as string[]) : [];
    this.onboardingStatus = typeof body.onboarding_status === "string" ? body.onboarding_status : null;
  }

  /** First message for a field (422 errors map). */
  field(key: string): string | undefined {
    return this.errors[key]?.[0];
  }
}

function authHeaders(withAuth: boolean): Record<string, string> {
  const h: Record<string, string> = { Accept: "application/json" };
  if (withAuth) {
    const token = typeof window !== "undefined" ? localStorage.getItem(apiEndpoints.tokenSetUrl) : null;
    if (token) h.Authorization = `Bearer ${token}`;
  }
  return h;
}

interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE";
  endPoint: string;
  body?: unknown;
  /** Public auth endpoints send no token. Default true. */
  auth?: boolean;
  signal?: AbortSignal;
  onUploadProgress?: (e: AxiosProgressEvent) => void;
}

export async function apiRequest<T = Record<string, unknown>>(opts: RequestOptions): Promise<T> {
  const withAuth = opts.auth !== false;
  try {
    const res = await axios.request<T>({
      method: opts.method,
      url: `${apiEndpoints.base}${opts.endPoint}`,
      data: opts.body,
      headers: authHeaders(withAuth),
      signal: opts.signal,
      onUploadProgress: opts.onUploadProgress,
    });
    return res.data;
  } catch (err) {
    if (axios.isCancel(err)) throw err;
    if (axios.isAxiosError(err)) {
      const status = err.response?.status ?? 0;
      const data = err.response?.data;
      const body = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
      if (status === 401 && withAuth) {
        forceReLogin();
      }
      const fallback =
        status === 0
          ? "We couldn't reach MyHisa. Check your connection and try again."
          : status === 429
          ? "Too many attempts. Please wait and try again."
          : "Something went wrong. Please try again.";
      throw new ApiError(status, body, fallback);
    }
    throw new ApiError(0, {}, "Something went wrong. Please try again.");
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;

export function errorMessage(e: unknown, fallback = "Something went wrong. Please try again."): string {
  if (e instanceof ApiError) return e.message;
  return fallback;
}

// ---------------------------------------------------------------------------
// Auth (public)
// ---------------------------------------------------------------------------

export interface AuthSession {
  token: string;
  user: User;
  otp?: { destination: string; duration_minutes: number } | null;
}

export const authApi = {
  checkEmail: (email: string) =>
    apiRequest<{ available: boolean }>({ method: "GET", endPoint: apiEndpoints.checkEmail(email), auth: false }),
  signup: (body: { email: string; password: string; confirm_password: string; phone: string; terms_version: string }) =>
    apiRequest<{ data: AuthSession; message: string }>({ method: "POST", endPoint: apiEndpoints.signup, body, auth: false }),
  login: (body: { email: string; password: string }) =>
    apiRequest<{ data: AuthSession; message: string }>({ method: "POST", endPoint: apiEndpoints.login, body, auth: false }),
  verifyEmail: (body: { email: string; otp: string }) =>
    apiRequest<{ message: string; onboarding_status?: string }>({
      method: "POST",
      endPoint: apiEndpoints.verifyEmail,
      body,
      auth: false,
    }),
  resendOtp: (email: string) =>
    apiRequest<{ message: string }>({ method: "POST", endPoint: apiEndpoints.resendVerificationOtp, body: { email }, auth: false }),
  forgotPassword: (email: string) =>
    apiRequest<{ message: string }>({ method: "POST", endPoint: apiEndpoints.forgotPassword, body: { email }, auth: false }),
  resetPassword: (body: { email: string; code: string; password: string; confirm_password: string }) =>
    apiRequest<{ message: string }>({ method: "POST", endPoint: apiEndpoints.resetPassword, body, auth: false }),
};

/** GET /me and store it (localStorage + cookie) so middleware sees changes. */
export async function refreshStoredUser(): Promise<User> {
  const res = await apiRequest<{ data: User }>({ method: "GET", endPoint: apiEndpoints.me });
  await storeUser(res.data);
  return res.data;
}

// ---------------------------------------------------------------------------
// Partner onboarding
// ---------------------------------------------------------------------------

type ViewResponse<Extra = {}> = { message: string; data: OnboardingView } & Extra;

export type BusinessInput = Partial<{
  business_type: string;
  rc_number: string;
  trading_name: string;
  partner_category: string;
  services_of_interest: string[];
  expected_volume_band: string;
  integration_method: string;
  address_line: string;
  address_state: string;
  address_lga: string;
  website: string;
}>;

export type SignatoryInput = Partial<{ name: string; role: string; phone: string; email: string; dob: string }>;

export const onboardingApi = {
  get: () => apiRequest<ViewResponse>({ method: "GET", endPoint: apiEndpoints.onboarding }),
  updateBusiness: (body: BusinessInput) =>
    apiRequest<ViewResponse>({ method: "PUT", endPoint: apiEndpoints.onboardingBusiness, body }),
  verifyCac: (body: { rc_number: string; business_type: string }) =>
    apiRequest<ViewResponse<{ verification: CacVerification }>>({
      method: "POST",
      endPoint: apiEndpoints.onboardingVerifyCac,
      body,
    }),
  updateSignatory: (body: SignatoryInput) =>
    apiRequest<ViewResponse>({ method: "PUT", endPoint: apiEndpoints.onboardingSignatory, body }),
  verifyIdentity: (body: { bvn: string; nin: string; dob?: string }) =>
    apiRequest<ViewResponse<{ verification: IdentityVerification }>>({
      method: "POST",
      endPoint: apiEndpoints.onboardingVerifyIdentity,
      body,
    }),
  uploadDocument: (type: KycDocumentType, file: File, onProgress?: (pct: number) => void, signal?: AbortSignal) => {
    const form = new FormData();
    form.append("file", file);
    return apiRequest<ViewResponse>({
      method: "POST",
      endPoint: apiEndpoints.onboardingDocument(type),
      body: form,
      signal,
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    });
  },
  deleteDocument: (type: KycDocumentType) =>
    apiRequest<ViewResponse>({ method: "DELETE", endPoint: apiEndpoints.onboardingDocument(type) }),
  submit: (body: { declaration: boolean; create_funding_account: boolean }) =>
    apiRequest<ViewResponse<{ funding_account?: FundingAccountResult }>>({
      method: "POST",
      endPoint: apiEndpoints.onboardingSubmit,
      body,
    }),
  reply: (note: string) =>
    apiRequest<ViewResponse>({ method: "POST", endPoint: apiEndpoints.onboardingReply, body: { note } }),
  reapply: () => apiRequest<ViewResponse>({ method: "POST", endPoint: apiEndpoints.onboardingReapply, body: {} }),
};

// ---------------------------------------------------------------------------
// Admin review
// ---------------------------------------------------------------------------

type DetailResponse = { message: string; data: AdminOnboardingDetail };

export const adminOnboardingApi = {
  queue: (params: { status?: string; category?: string; search?: string; page?: number; per_page?: number }) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") q.set(k, String(v));
    });
    const qs = q.toString();
    return apiRequest<{ message: string; data: AdminOnboardingQueue }>({
      method: "GET",
      endPoint: `${apiEndpoints.adminOnboardingQueue}${qs ? `?${qs}` : ""}`,
    });
  },
  detail: (userId: number | string) =>
    apiRequest<DetailResponse>({ method: "GET", endPoint: apiEndpoints.adminOnboardingDetail(userId) }),
  startReview: (userId: number | string, note?: string) =>
    apiRequest<DetailResponse>({ method: "POST", endPoint: apiEndpoints.adminOnboardingStartReview(userId), body: note ? { note } : {} }),
  approve: (userId: number | string, note?: string) =>
    apiRequest<DetailResponse>({ method: "POST", endPoint: apiEndpoints.adminOnboardingApprove(userId), body: note ? { note } : {} }),
  query: (userId: number | string, body: { note: string; fields: string[]; documents: string[] }) =>
    apiRequest<DetailResponse>({ method: "POST", endPoint: apiEndpoints.adminOnboardingQuery(userId), body }),
  reject: (userId: number | string, reason: string) =>
    apiRequest<DetailResponse>({ method: "POST", endPoint: apiEndpoints.adminOnboardingReject(userId), body: { reason } }),
  reviewDocument: (userId: number | string, type: string, body: { status: "accepted" | "flagged"; note?: string }) =>
    apiRequest<DetailResponse>({ method: "POST", endPoint: apiEndpoints.adminOnboardingDocumentReview(userId, type), body }),
};
