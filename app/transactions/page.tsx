"use client";
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DatePicker, Select, Skeleton, message } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import routes from "@/utils/routes";
import type { TransactionHistory, TransactionItem } from "@/utils/types";
import { BACKEND_DATE_FORMAT, formatCount, formatLagosDateTime, formatNaira, toLagos } from "@/utils/format";
import {
  NETWORK_OPTIONS,
  SERVICE_OPTIONS,
  STATUS_FILTERS,
  classifySearch,
  serviceLabel,
  statusTone,
  type StatusFilter,
} from "@/utils/transactions";
import { useShell } from "@/components/shell/ShellContext";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import StatusPill from "@/components/ui/StatusPill";
import { btnPrimary, btnSecondary, focusRing, textLink } from "@/components/ui/styles";
import TransactionDrawer from "./TransactionDrawer";
import {
  DATE_OPTIONS,
  type DateKey,
  type TxFilters,
  filterDateRange,
  hasActiveFilters,
  hasClientFilters,
  parseFilters,
  serializeFilters,
} from "./filters";

const { RangePicker } = DatePicker;

const PAGE_SIZE = 50;
// Backend limit for both the history date filter and the export job.
const MAX_RANGE_DAYS = 186;

// GET /history (controllers/telco SearchAndFilterTransaction + history_filters.go):
//   page, per_page (5..10000), from_date/to_date (YYYY-MM-DD, both, max ~6
//   months), type / network / status (comma lists, <=20 values),
//   refunded=true|false, search (exact transaction_id, external_ref,
//   ref_to_telco or msisdn; phone spellings normalised). All filtering is
//   server-side, so pagination totals are exact.
//
// Older backends (before onboarding-v2) only know transaction_id / msisdn /
// ref and silently ignore the rest. If a filtered request answers 400, or
// returns rows that plainly ignore the filters, the screen switches once to
// LEGACY mode for the session: smart search tries msisdn/ref/transaction_id
// in turn and service/network/status narrow the fetched page client-side,
// with a notice saying so.
type SearchField = "msisdn" | "ref" | "transaction_id";

const FIELD_LABEL: Record<SearchField, string> = {
  msisdn: "beneficiary",
  ref: "your reference",
  transaction_id: "transaction ID",
};

/**
 * LEGACY: an old backend matches one field per request, so the smart search
 * tries likely fields in order and keeps the first that has results.
 */
function searchCandidates(q: string): { field: SearchField; value: string }[] {
  if (!q) return [];
  const { kind, value } = classifySearch(q);
  if (kind === "beneficiary") {
    // A 10-14 digit value is usually a phone/meter/smartcard number, but
    // partners also use numeric references.
    return [
      { field: "msisdn", value },
      { field: "ref", value: q },
    ];
  }
  // Our transaction IDs are long numeric snowflakes; partner refs are free text.
  return /^\d{15,20}$/.test(value)
    ? [
        { field: "transaction_id", value },
        { field: "ref", value },
      ]
    : [
        { field: "ref", value },
        { field: "transaction_id", value },
      ];
}

// Status chip -> server params. Buckets mirror StatusPill/describeStatus:
// refunded_at wins (Refunded), TelcoError/InternalError are pending-like, and
// every final non-success status the backend defines counts as Failed.
const STATUS_PARAMS: Record<Exclude<StatusFilter, "all">, { status?: string; refunded: "true" | "false" }> = {
  success: { status: "Successful", refunded: "false" },
  pending: { status: "Pending,Processing,TelcoError,InternalError", refunded: "false" },
  failed: { status: "Failed,InvalidMsisdn,InvalidAmount,InvalidTelco,InsufficientBalance", refunded: "false" },
  refunded: { refunded: "true" },
};

/** Server-side filter params (new backend). */
function serverFilterParams(f: TxFilters): [string, string][] {
  const out: [string, string][] = [];
  const service = SERVICE_OPTIONS.find((s) => s.value === f.service);
  if (service) out.push(["type", service.types.join(",")]);
  if (f.network) out.push(["network", f.network]);
  if (f.status !== "all") {
    const sp = STATUS_PARAMS[f.status];
    if (sp.status) out.push(["status", sp.status]);
    out.push(["refunded", sp.refunded]);
  }
  if (f.q) out.push(["search", f.q]);
  return out;
}

/** LEGACY: narrow a fetched page by service / network / status. */
function clientFilter(records: TransactionItem[], f: TxFilters): TransactionItem[] {
  const service = SERVICE_OPTIONS.find((s) => s.value === f.service);
  return records.filter((t) => {
    if (service && !service.types.includes(t.type)) return false;
    if (f.network && (t.network ?? "").toLowerCase() !== f.network) return false;
    if (f.status !== "all" && statusTone(t) !== f.status) return false;
    return true;
  });
}

const lastTen = (v: string | null | undefined) => (v ?? "").replace(/\D/g, "").slice(-10);

/** Does a row satisfy the search the way the backend's exact match would? */
function matchesSearch(t: TransactionItem, q: string): boolean {
  if ([t.transaction_id, t.external_ref, t.ref_to_telco, t.msisdn].some((v) => v === q)) return true;
  const { kind, value } = classifySearch(q);
  return kind === "beneficiary" && lastTen(value).length === 10 && lastTen(t.msisdn) === lastTen(value);
}

/** False when the response clearly ignored the filters (older backend). */
function filtersHonoured(records: TransactionItem[], f: TxFilters): boolean {
  if (records.length === 0) return true;
  if (clientFilter(records, f).length !== records.length) return false;
  return !f.q || records.every((t) => matchesSearch(t, f.q));
}

function rowTime(createdAt: string): string {
  const d = toLagos(createdAt);
  if (!d.isValid()) return "";
  return d.isSame(toLagos(), "day")
    ? formatLagosDateTime(createdAt, "HH:mm:ss")
    : formatLagosDateTime(createdAt, "D MMM, HH:mm");
}

function errorMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: unknown; error?: unknown } } };
  const m = e?.response?.data?.message ?? e?.response?.data?.error;
  return typeof m === "string" && m ? m : "Check your connection and try again.";
}

const labelClass = "flex flex-col gap-1 text-xs font-semibold text-hisa-muted";

const TransactionsScreen = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { user, me } = useShell();
  const [messageApi, contextHolder] = message.useMessage();

  const queryString = searchParams.toString();
  const filters = useMemo(() => parseFilters(new URLSearchParams(queryString)), [queryString]);

  const applyFilters = useCallback(
    (patch: Partial<TxFilters>, opts: { keepPage?: boolean } = {}) => {
      const next: TxFilters = { ...filters, ...patch };
      if (!opts.keepPage && patch.page === undefined) next.page = 1;
      const qs = serializeFilters(next);
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [filters, pathname, router]
  );

  const clearFilters = () => {
    setPickingCustom(false);
    router.push(pathname, { scroll: false });
  };

  // ---- search box (applied on submit, or immediately when cleared) ----
  const [qInput, setQInput] = useState(filters.q);
  useEffect(() => setQInput(filters.q), [filters.q]);

  // "Custom range" chosen but no range picked yet: show the picker without
  // touching the URL (parseFilters drops a custom preset without dates).
  const [pickingCustom, setPickingCustom] = useState(false);
  const dateSelectValue: DateKey = pickingCustom ? "custom" : filters.date;

  // ---- data ----
  const [data, setData] = useState<TransactionHistory | null>(null);
  const [matchedField, setMatchedField] = useState<SearchField | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  // Sticky for the session once an older backend is detected (see top).
  const [legacy, setLegacy] = useState(false);
  const legacyRef = useRef(false);
  const requestId = useRef(0);
  // LEGACY: field that matched the current search, reused for pages 2+.
  const matchedRef = useRef<{ q: string; field: SearchField } | null>(null);

  const range = filterDateRange(filters);
  const serverKey = JSON.stringify([
    filters.q,
    range?.from ?? "",
    range?.to ?? "",
    filters.page,
    reloadKey,
    // Service/network/status only change the request when served server-side.
    legacy ? null : [filters.service, filters.network, filters.status],
  ]);

  useEffect(() => {
    const id = ++requestId.current;
    const api = new AxiosHandler(); // silent: errors render inline
    const base = new URLSearchParams();
    base.set("page", String(filters.page));
    base.set("per_page", String(PAGE_SIZE));
    if (range) {
      base.set("from_date", range.from);
      base.set("to_date", range.to);
    }
    const fetchWith = async (extra: [string, string][]) => {
      const p = new URLSearchParams(base);
      extra.forEach(([k, v]) => p.set(k, v));
      const res = await api.get({ endPoint: `${apiEndpoints.transactionHistory}?${p.toString()}` });
      if (!res?.data) throw new Error("Empty response");
      const body = res.data as TransactionHistory;
      return { ...body, records: body.records ?? [] };
    };

    const fetchLegacy = async (): Promise<{ result: TransactionHistory; field: SearchField | null }> => {
      const candidates = searchCandidates(filters.q);
      const remembered = matchedRef.current;
      if (candidates.length === 0) return { result: await fetchWith([]), field: null };
      if (filters.page > 1 && remembered && remembered.q === filters.q) {
        const cand = candidates.find((c) => c.field === remembered.field) ?? candidates[0];
        return { result: await fetchWith([[cand.field, cand.value]]), field: cand.field };
      }
      let result = await fetchWith([[candidates[0].field, candidates[0].value]]);
      let field: SearchField = candidates[0].field;
      for (let i = 1; i < candidates.length && (result.total_records ?? 0) === 0; i++) {
        const next = await fetchWith([[candidates[i].field, candidates[i].value]]);
        if ((next.total_records ?? 0) > 0) {
          result = next;
          field = candidates[i].field;
        }
      }
      return { result, field };
    };

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        let result: TransactionHistory | null = null;
        let field: SearchField | null = null;
        const params = serverFilterParams(filters);
        if (!legacyRef.current) {
          try {
            const r = await fetchWith(params);
            if (params.length === 0 || filtersHonoured(r.records, filters)) result = r;
            else legacyRef.current = true; // filters silently ignored
          } catch (err) {
            const status = (err as { response?: { status?: number } })?.response?.status;
            if (status !== 400 || params.length === 0) throw err;
            legacyRef.current = true; // maybe an older backend rejecting a param
          }
        }
        if (!result) {
          try {
            ({ result, field } = await fetchLegacy());
          } catch (err) {
            // Legacy request failed too: the 400 wasn't about the new params.
            if (legacyRef.current && !legacy) legacyRef.current = false;
            throw err;
          }
        }
        if (id !== requestId.current) return;
        if (legacyRef.current !== legacy) setLegacy(legacyRef.current);
        matchedRef.current = field ? { q: filters.q, field } : null;
        setMatchedField(field);
        setData(result);
      } catch (err) {
        if (id !== requestId.current) return;
        setError(errorMessage(err));
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    };
    run();
    // serverKey captures every input that changes the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverKey]);

  const records = useMemo(
    () => (data ? (legacy ? clientFilter(data.records, filters) : data.records) : []),
    [data, filters, legacy]
  );
  // True only when service/network/status are narrowing a page client-side.
  const clientFiltered = legacy && hasClientFilters(filters);

  // ---- drawer ----
  const [selected, setSelected] = useState<TransactionItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [returnFocusTo, setReturnFocusTo] = useState<HTMLElement | null>(null);

  const openRow = (t: TransactionItem, el: HTMLElement) => {
    setReturnFocusTo(el);
    setSelected(t);
    setDrawerOpen(true);
  };

  const onUpdated = useCallback((tx: TransactionItem) => {
    setSelected((cur) => (cur && cur.transaction_id === tx.transaction_id ? { ...cur, ...tx } : cur));
    setData((cur) =>
      cur
        ? {
            ...cur,
            records: cur.records.map((r) => (r.transaction_id === tx.transaction_id ? { ...r, ...tx } : r)),
          }
        : cur
    );
  }, []);

  // ---- export ----
  const [exporting, setExporting] = useState(false);
  const reportingEmails = (me ?? user)?.reporting_emails ?? "";
  const exportView = async () => {
    if (!range) {
      messageApi.info("Choose a date range of up to 6 months to export.");
      return;
    }
    setExporting(true);
    try {
      // POST export/transaction only takes from_date/to_date (+ optional
      // emails); it emails every transaction in the range. Search, service,
      // network and status are not applied to the file.
      await new AxiosHandler(messageApi).post({
        endPoint: `${apiEndpoints.exportTransaction}?from_date=${range.from}&to_date=${range.to}`,
        body: {},
      });
      const to = reportingEmails.split(",").map((e) => e.trim()).filter(Boolean).join(", ");
      messageApi.success({
        content: `We're preparing your export and will email it to ${to || "your reporting email"}.${
          filters.q || hasClientFilters(filters) ? " It includes every transaction in this date range." : ""
        }`,
        duration: 6,
      });
    } catch {
      // AxiosHandler showed the backend message (e.g. no reporting email set)
    } finally {
      setExporting(false);
    }
  };

  // ---- handlers ----
  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = qInput.trim();
    if (q !== filters.q) applyFilters({ q });
  };

  const onDateSelect = (key: DateKey) => {
    if (key === "custom") {
      setPickingCustom(true);
      return;
    }
    setPickingCustom(false);
    applyFilters({ date: key, from: "", to: "" });
  };

  const onRangeChange = (vals: [Dayjs | null, Dayjs | null] | null) => {
    if (!vals || !vals[0] || !vals[1]) return;
    if (vals[1].diff(vals[0], "day") > MAX_RANGE_DAYS) {
      messageApi.warning("Pick a range of up to 6 months.");
      return;
    }
    setPickingCustom(false);
    applyFilters({ date: "custom", from: vals[0].format(BACKEND_DATE_FORMAT), to: vals[1].format(BACKEND_DATE_FORMAT) });
  };

  const goToPage = (page: number) => applyFilters({ page }, { keepPage: true });

  // ---- footer numbers ----
  const total = data?.total_records ?? 0;
  const totalPages = data?.pagination?.total_pages ?? 0;
  const pageCount = data?.records.length ?? 0;
  const start = pageCount > 0 ? (filters.page - 1) * PAGE_SIZE + 1 : 0;
  const end = pageCount > 0 ? start + pageCount - 1 : 0;
  const canPrev = filters.page > 1;
  const canNext = totalPages > 0 ? filters.page < totalPages : pageCount === PAGE_SIZE;

  const rangeValue: [Dayjs, Dayjs] | null =
    filters.date === "custom" && filters.from && filters.to ? [dayjs(filters.from), dayjs(filters.to)] : null;

  const showSkeleton = loading && !data;
  const showError = !!error && !loading;

  return (
    <div className="flex flex-col gap-[16px] px-[16px] py-[20px] sm:p-[28px]">
      {contextHolder}
      <PageHeader
        title="Transactions"
        actions={
          <>
            <Link href={routes.exportTransacton} className={`${btnSecondary} h-10 rounded-[10px]`}>
              Exports
            </Link>
            <button type="button" className={btnPrimary} onClick={exportView} disabled={exporting} aria-busy={exporting}>
              {exporting ? "Requesting…" : "Export this view"}
            </button>
          </>
        }
      />

      {/* Filters */}
      <section
        aria-label="Filters"
        className="flex flex-col gap-3 rounded-[14px] border-[1px] border-solid border-hisa-border bg-white p-[14px]"
      >
        <div className="flex flex-wrap items-end gap-[10px]">
          <form role="search" onSubmit={onSearchSubmit} className="flex min-w-0 flex-[1_1_260px] flex-col gap-1">
            <label htmlFor="tx-search" className={labelClass}>
              Search
            </label>
            <div className="flex gap-2">
              <input
                id="tx-search"
                type="search"
                value={qInput}
                onChange={(e) => {
                  setQInput(e.target.value);
                  // Clearing the box (incl. the native ✕) resets the search.
                  if (e.target.value === "" && filters.q) applyFilters({ q: "" });
                }}
                placeholder="Reference, phone or meter number"
                aria-describedby="tx-search-hint"
                autoComplete="off"
                className={`h-10 min-w-0 flex-1 rounded-[8px] border-[1px] border-solid border-[#D0D5DD] bg-white px-[12px] text-sm text-hisa-ink placeholder:text-[#667085] ${focusRing}`}
              />
              <button type="submit" className={`${btnSecondary} h-10 w-10 px-0`} aria-label="Search">
                <SearchOutlined aria-hidden="true" />
              </button>
            </div>
            <span id="tx-search-hint" className="sr-only">
              Phone, meter and smartcard numbers search the beneficiary. Anything else searches your reference and our
              transaction ID. Press Enter to search.
            </span>
          </form>

          <div className={`${labelClass} min-w-0 flex-[1_1_150px] sm:flex-[0_1_170px]`}>
            <label htmlFor="tx-service">Service</label>
            <Select
              id="tx-service"
              value={filters.service}
              onChange={(v: string) => applyFilters({ service: v })}
              options={[{ value: "", label: "All services" }, ...SERVICE_OPTIONS.map((s) => ({ value: s.value, label: s.label }))]}
              size="large" className="w-full"
              popupMatchSelectWidth={false}
            />
          </div>

          <div className={`${labelClass} min-w-0 flex-[1_1_150px] sm:flex-[0_1_150px]`}>
            <label htmlFor="tx-network">Network</label>
            <Select
              id="tx-network"
              value={filters.network}
              onChange={(v: string) => applyFilters({ network: v })}
              options={[{ value: "", label: "All networks" }, ...NETWORK_OPTIONS]}
              size="large" className="w-full"
            />
          </div>

          <div className={`${labelClass} min-w-0 flex-[1_1_150px] sm:flex-[0_1_170px]`}>
            <label htmlFor="tx-date">Date (WAT)</label>
            <Select
              id="tx-date"
              value={dateSelectValue}
              onChange={(v: DateKey) => onDateSelect(v)}
              options={DATE_OPTIONS.map((o) => ({ value: o.key, label: o.label }))}
              size="large" className="w-full"
            />
          </div>

          {dateSelectValue === "custom" && (
            <div className={`${labelClass} min-w-0 flex-[1_1_260px] sm:flex-[0_1_280px]`}>
              <label htmlFor="tx-range">Custom range</label>
              <RangePicker
                id={{ start: "tx-range" }}
                value={rangeValue}
                onChange={(vals) => onRangeChange(vals as [Dayjs | null, Dayjs | null] | null)}
                format="DD MMM YYYY"
                maxDate={dayjs()}
                allowClear={false}
                size="large" className="w-full"
                autoFocus={pickingCustom}
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div role="group" aria-label="Status" className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((s) => {
              const pressed = filters.status === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => applyFilters({ status: s.key })}
                  className={`inline-flex h-8 items-center rounded-full border-[1px] border-solid px-[12px] text-[13px] font-semibold transition-colors ${focusRing} ${
                    pressed
                      ? "border-hisa-primary bg-hisa-primary-soft text-hisa-primary"
                      : "border-[#D0D5DD] bg-white text-hisa-body hover:bg-[#F9FAFB]"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          {hasActiveFilters(filters) && (
            <button type="button" onClick={clearFilters} className={`border-0 bg-transparent p-0 text-sm ${textLink}`}>
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* Results */}
      <section
        aria-label="Transactions"
        aria-busy={loading}
        className="flex min-w-0 flex-col overflow-hidden rounded-[14px] border-[1px] border-solid border-hisa-border bg-white"
      >
        {showSkeleton ? (
          <div className="p-[16px]">
            <Skeleton active title={false} paragraph={{ rows: 8 }} />
          </div>
        ) : showError ? (
          <EmptyState
            title="Couldn't load transactions"
            description={error}
            action={
              <button type="button" className={btnSecondary} onClick={() => setReloadKey((k) => k + 1)}>
                Retry
              </button>
            }
          />
        ) : records.length === 0 ? (
          <EmptyState
            title="No transactions match these filters"
            description={
              clientFiltered && pageCount > 0
                ? `None of the ${formatCount(pageCount)} transactions on this page match. Try another page or clear filters.`
                : filters.q && filters.date !== "all"
                ? "Searching only covers the selected dates."
                : undefined
            }
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {filters.q && filters.date !== "all" && (
                  <button type="button" className={btnSecondary} onClick={() => applyFilters({ date: "all", from: "", to: "" })}>
                    Search all dates
                  </button>
                )}
                {hasActiveFilters(filters) && (
                  <button type="button" className={btnSecondary} onClick={clearFilters}>
                    Clear filters
                  </button>
                )}
              </div>
            }
          />
        ) : (
          <div
            className={`overflow-x-auto transition-opacity ${loading ? "opacity-60" : ""}`}
            tabIndex={0}
            role="region"
            aria-label="Transactions table"
          >
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <caption className="sr-only">
                Transactions. Select a row to see details.
              </caption>
              <thead>
                <tr className="bg-[#F9FAFB] text-left text-xs uppercase tracking-[0.05em] text-hisa-muted">
                  <th scope="col" className="px-[16px] py-[10px] font-semibold">Time (WAT)</th>
                  <th scope="col" className="px-2 py-[10px] font-semibold">Service</th>
                  <th scope="col" className="px-2 py-[10px] font-semibold">Beneficiary</th>
                  <th scope="col" className="px-2 py-[10px] font-semibold">Your reference</th>
                  <th scope="col" className="px-2 py-[10px] text-right font-semibold">Amount</th>
                  <th scope="col" className="px-[16px] py-[10px] font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((t) => {
                  const isSelected = drawerOpen && selected?.transaction_id === t.transaction_id;
                  return (
                    <tr
                      key={t.transaction_id}
                      tabIndex={0}
                      onClick={(e) => openRow(t, e.currentTarget)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openRow(t, e.currentTarget);
                        }
                      }}
                      className={`cursor-pointer border-t-[1px] border-solid border-[#F2F4F7] transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-hisa-primary ${
                        isSelected ? "bg-hisa-primary-soft" : "hover:bg-[#F9FAFB]"
                      }`}
                    >
                      <td className="whitespace-nowrap px-[16px] py-[12px] text-hisa-muted">{rowTime(t.created_at)}</td>
                      <td className="px-2 py-[12px] text-hisa-ink">
                        {serviceLabel(t)}
                        <span className="sr-only">, open details</span>
                      </td>
                      <td className="whitespace-nowrap px-2 py-[12px] font-mono text-[13px] text-hisa-body">{t.msisdn}</td>
                      <td
                        className="max-w-[200px] truncate px-2 py-[12px] font-mono text-[13px] text-hisa-muted"
                        title={t.external_ref || undefined}
                      >
                        {t.external_ref || "—"}
                      </td>
                      <td className="whitespace-nowrap px-2 py-[12px] text-right font-mono text-[13px] text-hisa-ink">
                        {formatNaira(t.amount)}
                      </td>
                      <td className="px-[16px] py-[12px]">
                        <StatusPill status={t.status} refunded={t.refunded_at} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {data && !showError && (pageCount > 0 || filters.page > 1) && (
          <div className="flex flex-wrap items-center justify-between gap-[10px] border-t-[1px] border-solid border-hisa-border px-[16px] py-[12px] text-sm text-hisa-muted">
            <span aria-live="polite">
              {pageCount > 0 ? (
                total > 0 ? (
                  <>
                    {formatCount(start)}–{formatCount(end)} of {formatCount(total)}
                  </>
                ) : (
                  <>Page {filters.page}</>
                )
              ) : (
                <>No results on page {filters.page}</>
              )}
              {clientFiltered && pageCount > 0 && <> · {formatCount(records.length)} match on this page</>}
              {matchedField && <> · matched by {FIELD_LABEL[matchedField]}</>}
            </span>
            <nav aria-label="Pagination" className="flex gap-2">
              <button type="button" className={btnSecondary} disabled={!canPrev || loading} onClick={() => goToPage(filters.page - 1)}>
                Previous
              </button>
              <button type="button" className={btnSecondary} disabled={!canNext || loading} onClick={() => goToPage(filters.page + 1)}>
                Next
              </button>
            </nav>
          </div>
        )}
      </section>

      {clientFiltered && (
        <p className="m-0 text-xs text-hisa-muted">
          Service, network and status filters apply to the transactions on the current page.
          {filters.status === "pending" && (
            <>
              {" "}
              To see every pending transaction, use{" "}
              <Link href={routes.pendingTransactions} className={textLink}>
                Pending transactions
              </Link>
              .
            </>
          )}
        </p>
      )}

      <TransactionDrawer
        transaction={selected}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdated={onUpdated}
        returnFocusTo={returnFocusTo}
      />
    </div>
  );
};

const TransactionsPage = () => (
  // useSearchParams needs a Suspense boundary for static rendering.
  <Suspense
    fallback={
      <div className="flex flex-col gap-[16px] px-[16px] py-[20px] sm:p-[28px]">
        <Skeleton active title={{ width: 180 }} paragraph={{ rows: 10 }} />
      </div>
    }
  >
    <TransactionsScreen />
  </Suspense>
);

export default TransactionsPage;
