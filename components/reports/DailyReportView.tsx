"use client";
// The partner daily report screen, shared by the partner page (/reports,
// me/... endpoints) and the staff page (/admin/partners/:id/reports, admin
// endpoints): pass a ReportSource. Date lives in ?date= (Lagos calendar day,
// default yesterday).
//
// PDF = the browser's print dialog ("Save as PDF"): the print stylesheet
// below hides the app shell and controls, lays the report out on A4 with a
// header and a generated-at footer, and usePrintMode re-renders the charts
// at fixed A4 widths for the print pass.
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Skeleton, message } from "antd";
import { ArrowLeftOutlined, DownloadOutlined, FilePdfOutlined } from "@ant-design/icons";
import AxiosHandler from "@/utils/api/axiosHandler";
import type { DailyReport, DailyReportResponse } from "@/utils/types";
import { formatLagosDateTime } from "@/utils/format";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { btnSecondary, textLink } from "@/components/ui/styles";
import ReportDateBar from "./ReportDateBar";
import ReportKpis from "./ReportKpis";
import ReportSettingsCard from "./ReportSettingsCard";
import { HourlyChart, NetworkCharts, NetworkTable, ProductSplit, SuccessRateGrid } from "./ReportCharts";
import { usePrintMode } from "./usePrintMode";
import {
  ReportSource,
  apiErrorMessage,
  downloadReportCsv,
  formatReportDate,
  isReportableDate,
  lagosToday,
  lagosYesterday,
  normalizeReport,
} from "./reportUtils";

// Global while the report is mounted. Bootstrap 4's print CSS (loaded
// globally) sets `@page { size: a3 }` and `body { min-width: 992px }`; both
// are overridden here so the report fits A4 portrait.
const PRINT_CSS = `
@media print {
  @page { size: A4 portrait; margin: 12mm; }
  html, body { width: auto !important; min-width: 0 !important; height: auto !important; overflow: visible !important; background: #fff !important; }
  body aside, body header.sticky, .ant-message, .ant-tooltip, .ant-picker-dropdown { display: none !important; }
  #main-content, #main-content > * { background: #fff !important; }
  .daily-report { -webkit-print-color-adjust: exact; print-color-adjust: exact; color: #101828; }
  .daily-report section, .daily-report figure, .daily-report tr { break-inside: avoid; page-break-inside: avoid; }
  .daily-report a { text-decoration: none !important; }
}
`;

const printCard = "print:break-inside-avoid print:rounded-[8px] print:p-[14px]";

export interface ReportSettingsConfig {
  /** Hide the email settings card entirely. */
  hidden?: boolean;
  canEdit: boolean;
  defaultEmail?: string | null;
  readOnlyNote?: React.ReactNode;
}

interface DailyReportViewProps {
  source: ReportSource;
  title: string;
  /** Shown above the title (e.g. "← Users" on the staff page). */
  back?: { href: string; label: string };
  settings: ReportSettingsConfig;
  /** CSV filename when the API doesn't expose Content-Disposition. */
  csvFallbackName: (date: string) => string;
  /** Name for the print header before the report has loaded. */
  partnerName?: string | null;
}

const ReportSkeleton = () => (
  <div className="flex flex-col gap-[18px]" aria-busy="true" aria-label="Loading report">
    <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border-[1px] border-solid border-hisa-border bg-white p-[18px]">
          <Skeleton active title={{ width: "50%" }} paragraph={{ rows: 2, width: ["70%", "40%"] }} />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-2xl border-[1px] border-solid border-hisa-border bg-white p-[20px]">
          <Skeleton active paragraph={{ rows: 5 }} />
        </div>
      ))}
    </div>
    <div className="rounded-2xl border-[1px] border-solid border-hisa-border bg-white p-[20px]">
      <Skeleton active paragraph={{ rows: 6 }} />
    </div>
  </div>
);

const Sub = ({ children }: { children: React.ReactNode }) => <p className="m-0 text-[13px] text-hisa-muted">{children}</p>;

const DailyReportView = ({ source, title, back, settings, csvFallbackName, partnerName }: DailyReportViewProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messageApi, contextHolder] = message.useMessage();
  const { printing, print } = usePrintMode();

  const param = searchParams?.get("date") ?? null;
  const date = isReportableDate(param) ? param : lagosYesterday();

  // Keep ?date= in the URL (also replaces a missing/invalid/out-of-range
  // one), preserving a #email-report anchor.
  useEffect(() => {
    if (param !== date) router.replace(`${source.pageHref(date)}${window.location.hash}`, { scroll: false });
  }, [param, date, router, source]);

  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(
    async (d: string) => {
      const id = ++requestId.current;
      setLoading(true);
      setError(null);
      try {
        // Silent handler: errors show inline (a 401 still forces re-login).
        const res = (await new AxiosHandler().get({ endPoint: source.daily(d) })) as DailyReportResponse | undefined;
        if (!res?.data) throw new Error("empty report");
        if (id !== requestId.current) return;
        setReport(normalizeReport(res.data));
      } catch (err) {
        if (id !== requestId.current) return;
        setError(apiErrorMessage(err, "Couldn't load the report."));
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [source]
  );

  useEffect(() => {
    load(date);
  }, [date, load]);

  const setDate = (d: string) => {
    if (d !== date) router.replace(source.pageHref(d), { scroll: false });
  };

  const onCsv = async () => {
    setDownloading(true);
    try {
      const name = await downloadReportCsv(source.exportCsv(date), csvFallbackName(date));
      messageApi.success(`Downloaded ${name}`);
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : "Couldn't download the CSV. Try again.");
    } finally {
      setDownloading(false);
    }
  };

  // Only show a report that belongs to the selected day (an older day's
  // figures stay on screen, dimmed, while the new day loads).
  const shown = report && !error ? report : null;
  const stale = !!shown && (loading || shown.date !== date);
  const name = shown?.partner?.name || partnerName || "";
  const isToday = date === lagosToday();
  const dayLabel = formatReportDate(date, "ddd, D MMM YYYY");

  return (
    <div className="daily-report flex flex-col gap-[18px] px-[16px] py-[20px] sm:p-[28px] print:gap-[12px] print:p-0">
      <style>{PRINT_CSS}</style>
      {contextHolder}

      {back && (
        <Link href={back.href} className={`inline-flex items-center gap-2 self-start text-[13px] print:hidden ${textLink}`}>
          <ArrowLeftOutlined aria-hidden="true" /> {back.label}
        </Link>
      )}

      <div className="print:hidden">
        <PageHeader
          title={title}
          subtitle={
            <>
              {name ? `${name} · ` : ""}Transactions on {dayLabel} (Lagos time)
              {isToday ? " · live, updates as transactions come in" : ""}
            </>
          }
          actions={
            <>
              <button type="button" className={btnSecondary} onClick={onCsv} disabled={!shown || stale || downloading}>
                <DownloadOutlined aria-hidden="true" /> {downloading ? "Preparing…" : "Download CSV"}
              </button>
              <button type="button" className={btnSecondary} onClick={print} disabled={!shown || stale}>
                <FilePdfOutlined aria-hidden="true" /> Download PDF
              </button>
            </>
          }
        />
      </div>

      {/* Print header */}
      <header className="hidden border-b-[2px] border-solid border-hisa-primary pb-[8px] print:block">
        <h1 className="m-0 font-heading text-[18px] font-bold text-hisa-ink">
          {name ? `${name} — ` : ""}Daily transaction report — {formatReportDate(date)}
        </h1>
        <p className="m-0 mt-1 text-[11px] text-hisa-muted">
          {dayLabel}, 00:00–23:59 Lagos time (WAT){isToday ? " · partial day" : ""}
        </p>
      </header>

      <ReportDateBar date={date} onChange={setDate} busy={loading && !!shown} />

      {error ? (
        <Alert
          type="error"
          showIcon
          title={error}
          description={`We couldn't load the report for ${formatReportDate(date)}.`}
          action={
            <button type="button" className={btnSecondary} onClick={() => load(date)}>
              Retry
            </button>
          }
        />
      ) : !shown ? (
        <ReportSkeleton />
      ) : shown.totals.count === 0 ? (
        <Card className={printCard}>
          <EmptyState
            title={`No transactions on ${formatReportDate(shown.date)}`}
            description={
              isToday
                ? "Nothing has been processed yet today. Check back later or look at yesterday."
                : "Nothing was processed for this day (Lagos time). Pick another date to see its report."
            }
            action={
              date !== lagosYesterday() ? (
                <button type="button" className={`${btnSecondary} print:hidden`} onClick={() => setDate(lagosYesterday())}>
                  View yesterday
                </button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className={`flex flex-col gap-[18px] transition-opacity print:gap-[12px] ${stale ? "opacity-50" : ""}`} aria-busy={stale}>
          <ReportKpis report={shown} />

          <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2 print:grid-cols-1 print:gap-[12px]">
            <Card title="Product mix" className={printCard}>
              <Sub>Share of the day&apos;s transactions by product.</Sub>
              <ProductSplit products={shown.by_product} total={shown.totals.count} />
            </Card>
            <Card title="Success rate by network and product" className={printCard}>
              <Sub>Successful ÷ completed (pending excluded). Hover a cell for counts.</Sub>
              <SuccessRateGrid report={shown} />
            </Card>
          </div>

          <Card title="By network" className={printCard}>
            <Sub>Transactions and successful value (revenue) per network or biller.</Sub>
            <NetworkCharts networks={shown.by_network} printing={printing} />
            <NetworkTable report={shown} />
          </Card>

          <Card title="Hourly volume" className={printCard}>
            <Sub>Transactions per hour, Lagos time.</Sub>
            <HourlyChart hours={shown.by_hour} printing={printing} />
          </Card>
        </div>
      )}

      {shown && (
        <p className="m-0 text-xs text-hisa-muted print:hidden">
          Report generated {formatLagosDateTime(shown.generated_at)} (Lagos). Revenue is the value of successful
          transactions; refunded transactions are not counted as successful.
        </p>
      )}

      {!settings.hidden && (
        <ReportSettingsCard
          id="email-report"
          endpoint={source.settings}
          canEdit={settings.canEdit}
          defaultEmail={settings.defaultEmail}
          readOnlyNote={settings.readOnlyNote}
        />
      )}

      {/* Print footer */}
      <footer className="hidden border-t-[1px] border-solid border-hisa-border pt-[6px] text-[10px] text-hisa-muted print:block">
        {shown ? `Generated ${formatLagosDateTime(shown.generated_at)} (Lagos) · ` : ""}Amounts in naira; revenue = value
        of successful transactions; success rate = successful ÷ (successful + failed + refunded), pending excluded.
      </footer>
    </div>
  );
};

export default DailyReportView;
