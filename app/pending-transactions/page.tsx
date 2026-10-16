"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { DatePicker, Modal, Select, Table, message } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import routes from "@/utils/routes";
import { handleDownloadCSV, plainKoboNairaConvert } from "@/utils/helperfunctions";
import { isSandbox } from "@/utils/environment";
import { BACKEND_DATE_FORMAT, formatCount, formatLagosDateTime, formatNaira } from "@/utils/format";
import { NETWORK_OPTIONS, PENDING_TYPE_OPTIONS, REQUERYABLE_TYPES, formatAge, serviceLabel } from "@/utils/transactions";
import SandboxResolveActions from "@/components/SandboxResolveActions";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import StatusPill, { describeStatus } from "@/components/ui/StatusPill";
import { btnPrimary, btnSecondary, textLink } from "@/components/ui/styles";

const { RangePicker } = DatePicker;

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

// GET self-service/transactions/pending (adminTransactionController
// .GetPendingTransactionsUser): status IN (Pending, Processing), not yet
// refunded, own transactions only. Params: type, network, from, to
// (YYYY-MM-DD), limit, offset. Returns total_count for paging.
interface PendingTransaction {
  user_id: number;
  transaction_id: string;
  external_ref: string | null;
  amount: number;
  network: string;
  msisdn: string;
  type: string;
  status: string;
  status_code: string;
  created_at: string;
  balance_before: number;
  commission_amount: number;
  remark: string | null;
  response_transaction_id: string | null;
  refunded_at?: string | null;
}

interface PendingTransactionsResponse {
  filters: {
    type: string;
    network: string;
    from: string;
    to: string;
    limit: string;
    offset: string;
  };
  total_count: number;
  records_count: number;
  records: PendingTransaction[];
}

// One row of POST self-service/transactions/query-and-update-status.
interface QueryUpdateResult {
  transaction_id?: string;
  external_ref?: string;
  status: string;
  old_status?: string;
  new_status?: string | null;
  message?: string;
  ref?: string;
  current_status?: string;
}

interface Filters {
  type: string | null;
  network: string | null;
  range: [Dayjs, Dayjs] | null;
}

const EMPTY: Filters = { type: null, network: null, range: null };

function filterParams(f: Filters): URLSearchParams {
  const params = new URLSearchParams();
  if (f.type) params.append("type", f.type);
  if (f.network) params.append("network", f.network);
  if (f.range) {
    params.append("from", f.range[0].format(BACKEND_DATE_FORMAT));
    params.append("to", f.range[1].format(BACKEND_DATE_FORMAT));
  }
  return params;
}

const labelClass = "flex flex-col gap-1 text-xs font-semibold text-hisa-muted";

const PendingTransactions = () => {
  const [messageApi, contextHolder] = message.useMessage();
  // Draft filters (form) vs applied filters (what the table shows).
  const [draft, setDraft] = useState<Filters>(EMPTY);
  const [applied, setApplied] = useState<Filters>(EMPTY);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<PendingTransactionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [queryLoading, setQueryLoading] = useState<string | null>(null);
  const [queryResults, setQueryResults] = useState<QueryUpdateResult[] | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const requestId = useRef(0);

  // Ages ("pending 2h") tick once a minute.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Explicit arguments so paging always sends the offset being requested
  // (previously the offset state was never advanced).
  const fetchPage = useCallback(async (f: Filters, nextOffset: number, nextLimit: number) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(false);
    setSelected([]);
    try {
      const params = filterParams(f);
      params.append("limit", String(nextLimit));
      params.append("offset", String(nextOffset));
      const res = await new AxiosHandler().get({
        endPoint: `${apiEndpoints.selfServicePendingTransactions}?${params.toString()}`,
      });
      if (id !== requestId.current) return;
      const body = res?.data as PendingTransactionsResponse | undefined;
      setData(body ? { ...body, records: body.records ?? [] } : null);
      setNow(Date.now());
    } catch {
      if (id === requestId.current) setError(true);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  // Auto-load on mount.
  useEffect(() => {
    fetchPage(EMPTY, 0, 50);
  }, [fetchPage]);

  const reload = () => fetchPage(applied, offset, limit);

  const applyFilters = (e?: React.FormEvent) => {
    e?.preventDefault();
    setApplied(draft);
    setOffset(0);
    fetchPage(draft, 0, limit);
  };

  const clearFilters = () => {
    setDraft(EMPTY);
    setApplied(EMPTY);
    setOffset(0);
    fetchPage(EMPTY, 0, limit);
  };

  const onTableChange = (p: TablePaginationConfig) => {
    const size = p.pageSize ?? limit;
    const page = p.current ?? 1;
    const nextOffset = size !== limit ? 0 : (page - 1) * size;
    setLimit(size);
    setOffset(nextOffset);
    fetchPage(applied, nextOffset, size);
  };

  const runQuery = async (refs: string[], key: string) => {
    if (refs.length === 0) {
      messageApi.warning("Select at least one transaction.");
      return;
    }
    setQueryLoading(key);
    try {
      const res = await new AxiosHandler(messageApi).post({
        endPoint: `${apiEndpoints.selfServiceQueryAndUpdateStatus}?transaction_refs=${encodeURIComponent(refs.join(","))}`,
        body: {},
      });
      const results: QueryUpdateResult[] = Array.isArray(res?.data) ? res.data : [];
      setQueryResults(results);
      messageApi.success(`Checked ${formatCount(res?.count ?? results.length)} ${refs.length === 1 ? "transaction" : "transactions"}`);
      reload();
    } catch {
      // AxiosHandler showed the error
    } finally {
      setQueryLoading(null);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const params = filterParams(applied);
      params.append("limit", "10000");
      params.append("offset", "0");
      const res = await new AxiosHandler(messageApi).get({
        endPoint: `${apiEndpoints.selfServicePendingTransactions}?${params.toString()}`,
      });
      const all: PendingTransaction[] = res?.data?.records ?? [];
      // CSV keeps plain numeric naira so spreadsheets can sum it.
      const rows = all.map((item) => ({
        "Date (WAT)": formatLagosDateTime(item.created_at, "YYYY-MM-DD HH:mm:ss"),
        "Transaction ID": item.transaction_id,
        "Your reference": item.external_ref ?? "",
        Type: item.type,
        Network: item.network,
        Beneficiary: item.msisdn,
        "Amount (NGN)": plainKoboNairaConvert(item.amount),
        Status: item.status,
        "Status Code": item.status_code,
        "Network reference": item.response_transaction_id ?? "",
        Remark: item.remark ?? "",
      }));
      handleDownloadCSV(rows, `my_pending_transactions_${dayjs().format("YYYY-MM-DD")}.csv`);
      messageApi.success(`Exported ${formatCount(rows.length)} records`);
    } catch {
      // AxiosHandler showed the error
    } finally {
      setExportLoading(false);
    }
  };

  const columns: ColumnsType<PendingTransaction> = [
    {
      title: "Time (WAT)",
      dataIndex: "created_at",
      key: "created_at",
      width: 170,
      render: (v: string) => (
        <div className="flex flex-col">
          <span className="whitespace-nowrap">{formatLagosDateTime(v, "D MMM, HH:mm:ss")}</span>
          <span className="text-xs text-hisa-muted">pending {formatAge(v, now)}</span>
        </div>
      ),
    },
    {
      title: "Service",
      key: "service",
      width: 170,
      render: (_: unknown, r) => <span className="text-hisa-ink">{serviceLabel(r)}</span>,
    },
    {
      title: "Beneficiary",
      dataIndex: "msisdn",
      key: "msisdn",
      width: 140,
      render: (v: string) => <span className="font-mono text-[13px]">{v}</span>,
    },
    {
      title: "Your reference",
      dataIndex: "external_ref",
      key: "external_ref",
      width: 160,
      ellipsis: true,
      render: (v: string | null) => <span className="font-mono text-[13px] text-hisa-muted">{v || "—"}</span>,
    },
    {
      title: "Transaction ID",
      dataIndex: "transaction_id",
      key: "transaction_id",
      width: 190,
      render: (v: string) => <span className="font-mono text-[13px]">{v}</span>,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      width: 120,
      render: (v: number) => <span className="whitespace-nowrap font-mono text-[13px]">{formatNaira(v)}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (_: unknown, r) => <StatusPill status={r.status} refunded={r.refunded_at} />,
    },
    {
      title: "Actions",
      key: "actions",
      width: isSandbox ? 300 : 110,
      render: (_: unknown, r) => (
        <div className="flex flex-wrap items-center gap-2">
          {REQUERYABLE_TYPES.includes(r.type) && (
            <button
              type="button"
              className={btnSecondary}
              disabled={queryLoading !== null}
              aria-busy={queryLoading === r.transaction_id}
              onClick={() => runQuery([r.transaction_id], r.transaction_id)}
              aria-label={`Check status of ${r.transaction_id}`}
            >
              {queryLoading === r.transaction_id ? "Checking…" : "Check"}
            </button>
          )}
          {/* SANDBOX: per-row resolve actions (sandbox builds only). */}
          {isSandbox && (
            <SandboxResolveActions
              reference={r.transaction_id}
              status={r.status}
              refundedAt={r.refunded_at}
              onResolved={reload}
            />
          )}
        </div>
      ),
    },
  ];

  const total = data?.total_count ?? 0;
  const records = data?.records ?? [];
  const filtersActive = !!(applied.type || applied.network || applied.range);

  const updated = queryResults?.filter((r) => r.status === "updated") ?? [];
  const unchanged = queryResults?.filter((r) => r.status === "skipped" || r.status === "unchanged") ?? [];
  const errors = queryResults?.filter((r) => r.status === "error") ?? [];

  return (
    <div className="flex flex-col gap-[16px] px-[16px] py-[20px] sm:p-[28px]">
      {contextHolder}
      <PageHeader
        title="Pending transactions"
        subtitle="Waiting for the network to confirm. We keep checking these and only refund if they definitely failed."
        actions={
          <>
            <Link href={routes.transactions} className={`${btnSecondary} h-10 rounded-[10px]`}>
              All transactions
            </Link>
            <button
              type="button"
              className={`${btnSecondary} h-10 rounded-[10px]`}
              onClick={handleExport}
              disabled={exportLoading || total === 0}
              aria-busy={exportLoading}
            >
              {exportLoading ? "Exporting…" : "Export CSV"}
            </button>
          </>
        }
      />

      <form
        onSubmit={applyFilters}
        aria-label="Filters"
        className="flex flex-wrap items-end gap-[10px] rounded-[14px] border-[1px] border-solid border-hisa-border bg-white p-[14px]"
      >
        <div className={`${labelClass} min-w-0 flex-[1_1_150px] sm:flex-[0_1_180px]`}>
          <label htmlFor="pt-type">Service</label>
          <Select
            id="pt-type"
            size="large"
            placeholder="All services"
            value={draft.type}
            onChange={(v: string | null) => setDraft((d) => ({ ...d, type: v ?? null }))}
            options={PENDING_TYPE_OPTIONS}
            allowClear
            className="w-full"
          />
        </div>
        <div className={`${labelClass} min-w-0 flex-[1_1_150px] sm:flex-[0_1_160px]`}>
          <label htmlFor="pt-network">Network</label>
          <Select
            id="pt-network"
            size="large"
            placeholder="All networks"
            value={draft.network}
            onChange={(v: string | null) => setDraft((d) => ({ ...d, network: v ?? null }))}
            options={NETWORK_OPTIONS}
            allowClear
            className="w-full"
          />
        </div>
        <div className={`${labelClass} min-w-0 flex-[1_1_260px] sm:flex-[0_1_280px]`}>
          <label htmlFor="pt-range">Date range (WAT)</label>
          <RangePicker
            id={{ start: "pt-range" }}
            size="large"
            value={draft.range}
            onChange={(dates) =>
              setDraft((d) => ({
                ...d,
                range: dates && dates[0] && dates[1] ? [dates[0], dates[1]] : null,
              }))
            }
            format="DD MMM YYYY"
            maxDate={dayjs()}
            className="w-full"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className={btnPrimary} disabled={loading}>
            Apply
          </button>
          {(filtersActive || draft.type || draft.network || draft.range) && (
            <button type="button" className={`${btnSecondary} h-10`} onClick={clearFilters}>
              Clear
            </button>
          )}
        </div>
      </form>

      <section
        aria-label="Pending transactions"
        className="flex min-w-0 flex-col gap-3 rounded-[14px] border-[1px] border-solid border-hisa-border bg-white p-[14px]"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="m-0 text-sm text-hisa-muted" aria-live="polite">
            {data ? `${formatCount(total)} pending` : loading ? "Loading…" : ""}
            {selected.length > 0 && ` · ${formatCount(selected.length)} selected`}
          </p>
          {records.length > 0 && (
            <button
              type="button"
              className={btnPrimary}
              onClick={() => runQuery(selected, "bulk")}
              disabled={selected.length === 0 || queryLoading !== null}
              aria-busy={queryLoading === "bulk"}
            >
              {queryLoading === "bulk" ? "Checking…" : `Check status of selected (${selected.length})`}
            </button>
          )}
        </div>

        {error && !loading ? (
          <EmptyState
            title="Couldn't load pending transactions"
            action={
              <button type="button" className={btnSecondary} onClick={reload}>
                Retry
              </button>
            }
          />
        ) : !loading && data && records.length === 0 && offset === 0 ? (
          <EmptyState
            title={filtersActive ? "No pending transactions match these filters" : "Nothing pending"}
            description={filtersActive ? undefined : "Every transaction has a final status."}
            action={
              filtersActive ? (
                <button type="button" className={btnSecondary} onClick={clearFilters}>
                  Clear filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <Table<PendingTransaction>
            dataSource={records}
            columns={columns}
            rowKey="transaction_id"
            loading={loading}
            size="middle"
            scroll={{ x: isSandbox ? 1380 : 1190 }}
            rowSelection={{
              selectedRowKeys: selected,
              onChange: (keys) => setSelected(keys.map(String)),
              getCheckboxProps: (r) => ({
                disabled: !REQUERYABLE_TYPES.includes(r.type),
                "aria-label": `Select ${r.transaction_id}`,
              }),
            }}
            pagination={{
              current: Math.floor(offset / limit) + 1,
              pageSize: limit,
              total,
              showSizeChanger: true,
              pageSizeOptions: PAGE_SIZE_OPTIONS,
              showTotal: (t, [from, to]) => `${formatCount(from)}–${formatCount(to)} of ${formatCount(t)}`,
            }}
            onChange={onTableChange}
          />
        )}
      </section>

      <Modal
        title="Status check results"
        open={!!queryResults}
        onCancel={() => setQueryResults(null)}
        footer={
          <button type="button" className={btnSecondary} onClick={() => setQueryResults(null)}>
            Close
          </button>
        }
        width={720}
      >
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Updated", count: updated.length, cls: "bg-[#ECFDF3] text-[#067647]" },
              { label: "No change yet", count: unchanged.length, cls: "bg-[#FFFAEB] text-[#93370D]" },
              { label: "Errors", count: errors.length, cls: "bg-[#FEF3F2] text-[#B42318]" },
            ].map((b) => (
              <div key={b.label} className={`rounded-[12px] px-[12px] py-[10px] text-center ${b.cls}`}>
                <div className="font-heading text-2xl font-bold">{b.count}</div>
                <div className="text-xs font-semibold">{b.label}</div>
              </div>
            ))}
          </div>
          <ul className="m-0 flex max-h-96 list-none flex-col gap-2 overflow-y-auto p-0">
            {(queryResults ?? []).map((r, i) => (
              <li
                key={`${r.transaction_id ?? r.ref ?? ""}-${i}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border-[1px] border-solid border-hisa-border px-[12px] py-[10px]"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="break-all font-mono text-[13px]">{r.transaction_id || r.ref}</span>
                  {r.external_ref && <span className="text-xs text-hisa-muted">{r.external_ref}</span>}
                </div>
                <span className="text-sm">
                  {r.status === "updated" ? (
                    <>
                      {describeStatus(r.old_status).label} → <StatusPill status={r.new_status} />
                    </>
                  ) : r.status === "unchanged" ? (
                    "Network hasn't confirmed yet"
                  ) : (
                    <span className={r.status === "error" ? "text-[#B42318]" : "text-hisa-muted"}>{r.message}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <p className="m-0 text-xs text-hisa-muted">
            Need to dig into one?{" "}
            <Link href={routes.transactionLookup} className={textLink}>
              Look it up
            </Link>
            .
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default PendingTransactions;
