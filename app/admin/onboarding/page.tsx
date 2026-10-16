"use client";
// Admin onboarding review queue: GET /admin/onboarding/queue (server
// pagination, oldest submission first).
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Table, Tabs } from "antd";
import type { TableColumnsType } from "antd";
import routes from "@/utils/routes";
import useRequirePermission from "@/utils/useRequirePermission";
import { adminOnboardingApi, errorMessage } from "@/utils/api/onboardingApi";
import { PARTNER_CATEGORIES, VOLUME_BANDS, labelOf } from "@/utils/onboarding";
import { formatLagosDateTime } from "@/utils/format";
import type { AdminOnboardingQueueItem, OnboardingStatus } from "@/utils/types";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { btnSecondary, focusRing, textLink } from "@/components/ui/styles";
import { CheckBadge, OnboardingStatusPill, slaClass, slaLabel } from "@/components/onboarding/admin/badges";

const TABS: { key: OnboardingStatus; label: string }[] = [
  { key: "submitted", label: "Submitted" },
  { key: "in_review", label: "In review" },
  { key: "queried", label: "Queried" },
  { key: "rejected", label: "Rejected" },
];

const selectCls = `h-9 rounded-[8px] border-[1px] border-solid border-[#D0D5DD] bg-white px-[10px] text-sm text-hisa-body ${focusRing}`;

export default function AdminOnboardingQueuePage() {
  const authorized = useRequirePermission("users.view");
  const router = useRouter();
  const [status, setStatus] = useState<OnboardingStatus>("submitted");
  const [category, setCategory] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [items, setItems] = useState<AdminOnboardingQueueItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminOnboardingApi.queue({ status, category, search, page, per_page: perPage });
      setItems(res.data.items ?? []);
      setTotal(res.data.total ?? 0);
    } catch (err) {
      setError(errorMessage(err, "Couldn't load the queue."));
      setItems([]);
    }
    setLoading(false);
  }, [status, category, search, page, perPage]);

  useEffect(() => {
    if (authorized) load();
  }, [authorized, load]);

  if (!authorized) return null;

  const active = status === "submitted" || status === "in_review";

  const columns: TableColumnsType<AdminOnboardingQueueItem> = [
    {
      title: "Business",
      key: "business",
      render: (_, r) => (
        <div className="flex min-w-[180px] flex-col gap-[2px]">
          <Link href={routes.adminOnboardingDetail(r.user_id)} className={`${textLink} text-[14px]`}>
            {r.name || r.trading_name || r.email}
          </Link>
          {r.trading_name && r.name && r.trading_name !== r.name && (
            <span className="text-[13px] text-hisa-muted">t/a {r.trading_name}</span>
          )}
          <span className="text-[12px] text-hisa-muted">
            {r.email}
            {r.flow !== "v2" && <span className="ml-2 rounded-[4px] bg-[#F2F4F7] px-[6px] py-[1px] text-[11px] font-semibold">Legacy</span>}
          </span>
        </div>
      ),
    },
    {
      title: "Category",
      key: "category",
      render: (_, r) => (
        <span className="text-[13px]">
          {labelOf(PARTNER_CATEGORIES, r.partner_category) || (r.partner_type === "bank" ? "Bank (legacy)" : r.partner_type ? "Non-bank (legacy)" : "—")}
        </span>
      ),
    },
    {
      title: "Volume",
      key: "volume",
      responsive: ["md"],
      render: (_, r) => <span className="text-[13px]">{labelOf(VOLUME_BANDS, r.expected_volume_band ?? null) || "—"}</span>,
    },
    {
      title: "Submitted",
      key: "submitted",
      render: (_, r) => (
        <div className="flex flex-col gap-[2px] whitespace-nowrap">
          <span className="text-[13px]">{r.submitted_at ? formatLagosDateTime(r.submitted_at) : "—"}</span>
          <span className={`text-[12px] ${slaClass(r.waiting_seconds, active)}`}>
            {active ? `Waiting ${r.waiting}` : `${r.waiting} ago`}
            {active && <span className="sr-only"> ({slaLabel(r.waiting_seconds, active)})</span>}
          </span>
        </div>
      ),
    },
    {
      title: "Checks",
      key: "checks",
      render: (_, r) => (
        <div className="flex flex-wrap gap-1">
          <CheckBadge label="CAC" status={r.checks?.cac?.status} />
          <CheckBadge label="BVN" status={r.checks?.bvn?.status} />
          <CheckBadge label="NIN" status={r.checks?.nin?.status} />
          {r.identity_match === "mismatch" && (
            <span className="whitespace-nowrap rounded-full bg-[#FEF0C7] px-2 py-[2px] text-[12px] font-semibold text-[#93370D]">Name mismatch</span>
          )}
        </div>
      ),
    },
    {
      title: "Docs",
      key: "docs",
      render: (_, r) => {
        const legacyCount =
          (r.legacy_documents?.cac_certificate_uploaded_at ? 1 : 0) + (r.legacy_documents?.utility_bill_uploaded_at ? 1 : 0);
        const uploaded = r.flow === "v2" ? r.documents.length : Math.max(r.documents.length, legacyCount);
        const flagged = r.documents.filter((d) => d.status === "flagged").length;
        return (
          <div className="flex flex-col gap-[2px] whitespace-nowrap text-[13px]">
            <span>{uploaded} uploaded</span>
            {r.missing_documents.length > 0 && <span className="font-semibold text-[#B42318]">{r.missing_documents.length} missing</span>}
            {flagged > 0 && <span className="font-semibold text-[#B54708]">{flagged} flagged</span>}
          </div>
        );
      },
    },
    {
      title: <span className="sr-only">Status</span>,
      key: "status",
      responsive: ["lg"],
      render: (_, r) => <OnboardingStatusPill status={r.onboarding_status} />,
    },
  ];

  return (
    <main className="flex flex-col gap-5 px-[16px] py-[20px] sm:px-[24px]">
      <PageHeader
        title="Onboarding queue"
        subtitle="Partner applications, oldest first. Over 24 hours waiting shows amber, over 48 hours red."
        actions={
          <button type="button" className={btnSecondary} onClick={() => load()} disabled={loading}>
            Refresh
          </button>
        }
      />

      <Card flush ariaLabel="Applications">
        <div className="flex flex-col gap-3 px-[20px]">
          <Tabs
            activeKey={status}
            onChange={(k) => {
              setStatus(k as OnboardingStatus);
              setPage(1);
            }}
            items={TABS.map((t) => ({ key: t.key, label: t.label }))}
          />
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(searchInput.trim());
              setPage(1);
            }}
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="q-category" className="m-0 text-[13px] font-semibold text-hisa-body">
                Category
              </label>
              <select
                id="q-category"
                className={selectCls}
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All categories</option>
                {PARTNER_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex min-w-[200px] flex-1 flex-col gap-1">
              <label htmlFor="q-search" className="m-0 text-[13px] font-semibold text-hisa-body">
                Search
              </label>
              <input
                id="q-search"
                type="search"
                placeholder="Name, email or RC number"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={`${selectCls} w-full`}
              />
            </div>
            <button type="submit" className={btnSecondary}>
              Search
            </button>
          </form>
          {error && (
            <p role="alert" className="m-0 text-sm text-[#B42318]">
              {error}
            </p>
          )}
        </div>
        <div className="overflow-x-auto">
          <Table<AdminOnboardingQueueItem>
            rowKey="user_id"
            columns={columns}
            dataSource={items}
            loading={loading}
            size="middle"
            onRow={(r) => ({
              onClick: (e) => {
                if ((e.target as HTMLElement).closest("a,button")) return;
                router.push(routes.adminOnboardingDetail(r.user_id));
              },
              className: "cursor-pointer",
            })}
            locale={{
              emptyText: (
                <EmptyState
                  title={search || category ? "No applications match these filters" : "Nothing here right now"}
                  description={status === "submitted" ? "New applications appear here as soon as partners submit." : undefined}
                />
              ),
            }}
            pagination={{
              current: page,
              pageSize: perPage,
              total,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              showTotal: (t) => `${t} application${t === 1 ? "" : "s"}`,
              onChange: (p, size) => {
                if (size !== perPage) {
                  setPerPage(size);
                  setPage(1);
                } else {
                  setPage(p);
                }
              },
            }}
          />
        </div>
      </Card>
    </main>
  );
}
