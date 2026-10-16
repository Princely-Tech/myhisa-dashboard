"use client";
// Charts and tables of the partner daily report. Flat 2D marks only, values
// labelled directly, every chart has a table twin (the network table, the
// product legend table, the hourly "Show as table"), so tooltips never gate
// a value. Colours: see reportUtils (validated categorical order, binned
// one-hue scale for the success-rate grid).
import React from "react";
import { Tooltip as AntTooltip } from "antd";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCount, formatNaira } from "@/utils/format";
import type { DailyReport, DailyReportNetwork, DailyReportNetworkProduct, DailyReportProduct } from "@/utils/types";
import {
  CATEGORICAL,
  OTHER_COLOR,
  RATE_BINS,
  compactCount,
  compactNaira,
  decidedCount,
  formatRate,
  formatShare,
  productColors,
  rateFill,
  textOn,
} from "./reportUtils";

// Chart chrome (recessive, solid hairlines).
const INK_SECONDARY = "#475467";
const INK_BODY = "#344054";
const GRID = "#EAECF0";
const CURSOR = "#F2F4F7";
const MONO = "var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, monospace";
const SANS = "var(--font-plex-sans), 'IBM Plex Sans', system-ui, sans-serif";

/** Usable A4 width at 96dpi with 12mm margins is ~700px; minus card padding. */
export const PRINT_FULL_WIDTH = 660;
/** Two columns with a 20px gap. */
export const PRINT_HALF_WIDTH = 320;

// ---------------------------------------------------------------------------
// Chart container: responsive on screen, fixed width on paper
// ---------------------------------------------------------------------------

interface ChartBoxProps {
  height: number;
  printing: boolean;
  printWidth: number;
  children: React.ReactElement<{ width?: number; height?: number }>;
}

/**
 * ResponsiveContainer measures the on-screen layout, which is wrong while
 * printing; the print pass renders the chart at an explicit A4 width.
 * `height` includes the x-axis band so the card never scrolls.
 */
export const ChartBox = ({ height, printing, printWidth, children }: ChartBoxProps) =>
  printing ? (
    React.cloneElement(children, { width: printWidth, height })
  ) : (
    <ResponsiveContainer width="100%" height={height}>
      {children}
    </ResponsiveContainer>
  );

// Tooltip shell shared by the recharts tooltips: value first, label after.
const TipShell = ({ title, rows }: { title: string; rows: { key: string; color?: string; label: string; value: string }[] }) => (
  <div className="min-w-[160px] rounded-[10px] border-[1px] border-solid border-hisa-border bg-white px-[12px] py-[10px] text-[13px] shadow-[0_8px_24px_rgba(16,24,40,0.12)]">
    <p className="m-0 mb-[6px] font-semibold text-hisa-ink">{title}</p>
    <ul className="m-0 flex list-none flex-col gap-1 p-0">
      {rows.map((r) => (
        <li key={r.key} className="flex items-center gap-2">
          {r.color && <span aria-hidden="true" className="inline-block h-[2px] w-[12px] shrink-0" style={{ background: r.color }} />}
          <span className="font-mono font-medium text-hisa-ink">{r.value}</span>
          <span className="text-hisa-muted">{r.label}</span>
        </li>
      ))}
    </ul>
  </div>
);

interface RechartsTipProps<T> {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: T }>;
}

// ---------------------------------------------------------------------------
// Product split: one 100% stacked bar + legend table
// ---------------------------------------------------------------------------

export const ProductSplit = ({ products, total }: { products: DailyReportProduct[]; total: number }) => {
  const colors = productColors(products.map((p) => p.type));
  return (
    <div className="flex flex-col gap-[14px]">
      <div
        role="img"
        aria-label={`Share of transactions by product: ${products
          .map((p) => `${p.type} ${formatShare(p.count, total)}`)
          .join(", ")}`}
        className="flex h-8 w-full gap-[2px]"
      >
        {products.map((p, i) => {
          const share = total ? (p.count / total) * 100 : 0;
          const color = colors[p.type] ?? OTHER_COLOR;
          const first = i === 0;
          const last = i === products.length - 1;
          return (
            <AntTooltip
              key={p.type}
              title={`${p.type}: ${formatCount(p.count)} transactions (${formatShare(p.count, total)}) · ${formatNaira(
                p.successful_value_kobo
              )} successful`}
            >
              <div
                tabIndex={0}
                aria-label={`${p.type} ${formatShare(p.count, total)}`}
                className="flex h-full min-w-[3px] items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-hisa-ink"
                style={{
                  width: `${share}%`,
                  background: color,
                  borderTopLeftRadius: first ? 4 : 0,
                  borderBottomLeftRadius: first ? 4 : 0,
                  borderTopRightRadius: last ? 4 : 0,
                  borderBottomRightRadius: last ? 4 : 0,
                }}
              >
                {/* Inline label only where it fits; the legend carries the rest. */}
                {share >= 12 && (
                  <span className="whitespace-nowrap px-1 font-mono text-xs font-medium" style={{ color: textOn(color) }}>
                    {formatShare(p.count, total)}
                  </span>
                )}
              </div>
            </AntTooltip>
          );
        })}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <caption className="sr-only">Transactions by product</caption>
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.05em] text-hisa-muted">
              <th scope="col" className="py-[6px] pr-2 font-semibold">Product</th>
              <th scope="col" className="px-2 py-[6px] text-right font-semibold">Transactions</th>
              <th scope="col" className="px-2 py-[6px] text-right font-semibold">Share</th>
              <th scope="col" className="px-2 py-[6px] text-right font-semibold">Successful value</th>
              <th scope="col" className="py-[6px] pl-2 text-right font-semibold">Success rate</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.type} className="border-t-[1px] border-solid border-[#F2F4F7]">
                <th scope="row" className="py-[8px] pr-2 text-left font-medium text-hisa-ink">
                  <span className="inline-flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="inline-block h-[10px] w-[10px] shrink-0 rounded-[2px]"
                      style={{ background: colors[p.type] ?? OTHER_COLOR }}
                    />
                    {p.type}
                  </span>
                </th>
                <td className="px-2 py-[8px] text-right font-mono tabular-nums text-hisa-ink">{formatCount(p.count)}</td>
                <td className="px-2 py-[8px] text-right font-mono tabular-nums text-hisa-body">{formatShare(p.count, total)}</td>
                <td className="px-2 py-[8px] text-right font-mono tabular-nums text-hisa-ink">{formatNaira(p.successful_value_kobo)}</td>
                <td className="py-[8px] pl-2 text-right font-mono tabular-nums text-hisa-body">{formatRate(p.success_rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// By network: two small-multiple bar charts (count | successful value).
// Two measures of different scale -> two charts, never a dual axis.
// ---------------------------------------------------------------------------

/** Chart rows beyond this fold into "Other" (the table lists every network). */
const MAX_NETWORK_BARS = 8;

interface NetworkBarRow {
  label: string;
  count: number;
  successful_value_kobo: number;
}

function networkBarRows(networks: DailyReportNetwork[]): NetworkBarRow[] {
  const rows = networks.slice(0, MAX_NETWORK_BARS).map((n) => ({
    label: n.label,
    count: n.count,
    successful_value_kobo: n.successful_value_kobo,
  }));
  const rest = networks.slice(MAX_NETWORK_BARS);
  if (rest.length) {
    rows.push({
      label: `Other (${rest.length})`,
      count: rest.reduce((s, n) => s + n.count, 0),
      successful_value_kobo: rest.reduce((s, n) => s + n.successful_value_kobo, 0),
    });
  }
  return rows;
}

const NetworkTip = ({ active, payload }: RechartsTipProps<NetworkBarRow>) => {
  const row = active ? payload?.[0]?.payload : undefined;
  if (!row) return null;
  return (
    <TipShell
      title={row.label}
      rows={[
        { key: "c", label: "transactions", value: formatCount(row.count) },
        { key: "v", label: "successful value", value: formatNaira(row.successful_value_kobo) },
      ]}
    />
  );
};

const NetworkBarChart = ({
  rows,
  dataKey,
  format,
  printing,
}: {
  rows: NetworkBarRow[];
  dataKey: "count" | "successful_value_kobo";
  format: (n: number) => string;
  printing: boolean;
}) => {
  const height = rows.length * 34 + 8;
  return (
    <ChartBox height={height} printing={printing} printWidth={PRINT_HALF_WIDTH}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 64, bottom: 4, left: 0 }} barCategoryGap={8}>
        <XAxis type="number" hide domain={[0, "dataMax"]} />
        <YAxis
          type="category"
          dataKey="label"
          width={96}
          tickLine={false}
          axisLine={{ stroke: "#D0D5DD" }}
          tick={{ fill: INK_SECONDARY, fontSize: 12, fontFamily: SANS }}
          interval={0}
        />
        {!printing && <Tooltip cursor={{ fill: CURSOR }} content={<NetworkTip />} isAnimationActive={false} />}
        <Bar dataKey={dataKey} fill={CATEGORICAL[0]} radius={[0, 4, 4, 0]} maxBarSize={20} isAnimationActive={false}>
          <LabelList
            dataKey={dataKey}
            position="right"
            offset={6}
            formatter={(v: unknown) => format(Number(v) || 0)}
            style={{ fill: INK_BODY, fontSize: 12, fontFamily: MONO }}
          />
        </Bar>
      </BarChart>
    </ChartBox>
  );
};

export const NetworkCharts = ({ networks, printing }: { networks: DailyReportNetwork[]; printing: boolean }) => {
  const rows = networkBarRows(networks);
  return (
    <div className="grid grid-cols-1 gap-[20px] md:grid-cols-2 print:grid-cols-2">
      <figure className="m-0 flex min-w-0 flex-col gap-2">
        <figcaption className="text-[13px] font-semibold text-hisa-body">Transactions</figcaption>
        <NetworkBarChart rows={rows} dataKey="count" format={(n) => formatCount(n)} printing={printing} />
      </figure>
      <figure className="m-0 flex min-w-0 flex-col gap-2">
        <figcaption className="text-[13px] font-semibold text-hisa-body">Successful value (revenue)</figcaption>
        <NetworkBarChart rows={rows} dataKey="successful_value_kobo" format={compactNaira} printing={printing} />
      </figure>
    </div>
  );
};

export const NetworkTable = ({ report }: { report: DailyReport }) => {
  const showPending = report.totals.pending_count > 0;
  const showRefunded = report.totals.refunded_count > 0;
  const th = "px-2 py-[10px] text-right font-semibold";
  const td = "px-2 py-[9px] text-right font-mono tabular-nums";
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <caption className="sr-only">Transactions, revenue and success rate by network</caption>
        <thead>
          <tr className="bg-[#F9FAFB] text-left text-xs uppercase tracking-[0.05em] text-hisa-muted">
            <th scope="col" className="px-[12px] py-[10px] font-semibold">Network</th>
            <th scope="col" className={th}>Transactions</th>
            <th scope="col" className={th}>Revenue</th>
            <th scope="col" className={th}>Success rate</th>
            <th scope="col" className={th}>Failed</th>
            {showPending && <th scope="col" className={th}>Pending</th>}
            {showRefunded && <th scope="col" className={`${th} pr-[12px]`}>Refunded</th>}
          </tr>
        </thead>
        <tbody>
          {report.by_network.map((n) => (
            <tr key={n.network} className="border-t-[1px] border-solid border-[#F2F4F7]">
              <th scope="row" className="px-[12px] py-[9px] text-left font-medium text-hisa-ink">{n.label}</th>
              <td className={`${td} text-hisa-ink`}>{formatCount(n.count)}</td>
              <td className={`${td} text-hisa-ink`}>{formatNaira(n.successful_value_kobo)}</td>
              <td className={`${td} text-hisa-body`}>{formatRate(n.success_rate)}</td>
              <td className={`${td} ${n.failed_count > 0 ? "text-[#B42318]" : "text-hisa-muted"}`}>{formatCount(n.failed_count)}</td>
              {showPending && <td className={`${td} text-hisa-body`}>{formatCount(n.pending_count)}</td>}
              {showRefunded && <td className={`${td} pr-[12px] text-hisa-body`}>{formatCount(n.refunded_count)}</td>}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-[1px] border-solid border-hisa-border font-semibold">
            <th scope="row" className="px-[12px] py-[10px] text-left text-hisa-ink">Total</th>
            <td className={`${td} text-hisa-ink`}>{formatCount(report.totals.count)}</td>
            <td className={`${td} text-hisa-ink`}>{formatNaira(report.totals.successful_value_kobo)}</td>
            <td className={`${td} text-hisa-ink`}>{formatRate(report.totals.success_rate)}</td>
            <td className={`${td} text-hisa-ink`}>{formatCount(report.totals.failed_count)}</td>
            {showPending && <td className={`${td} text-hisa-ink`}>{formatCount(report.totals.pending_count)}</td>}
            {showRefunded && <td className={`${td} pr-[12px] text-hisa-ink`}>{formatCount(report.totals.refunded_count)}</td>}
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Success rate by network x product: binned one-hue heat grid
// ---------------------------------------------------------------------------

function cellTip(network: string, type: string, p: DailyReportNetworkProduct | undefined): string {
  if (!p || p.count === 0) return `${network} · ${type}: no transactions`;
  const parts = [
    `${formatCount(p.successful_count)} successful`,
    `${formatCount(p.failed_count)} failed`,
  ];
  if (p.pending_count) parts.push(`${formatCount(p.pending_count)} pending`);
  if (p.refunded_count) parts.push(`${formatCount(p.refunded_count)} refunded`);
  return `${network} · ${type}: ${formatRate(p.success_rate)} — ${formatCount(p.count)} transactions (${parts.join(", ")})`;
}

export const SuccessRateGrid = ({ report }: { report: DailyReport }) => {
  // Products in report order (by_product is sorted by count), plus any that
  // only appear under a network.
  const types: string[] = report.by_product.map((p) => p.type);
  for (const n of report.by_network) for (const p of n.products) if (!types.includes(p.type)) types.push(p.type);

  return (
    <div className="flex flex-col gap-[12px]">
      <div className="overflow-x-auto">
        <table className="w-full border-separate text-sm" style={{ borderSpacing: 2, minWidth: 140 + types.length * 110 }}>
          <caption className="sr-only">
            Success rate by network and product. Each cell shows the rate and successful of completed transactions
            (pending excluded).
          </caption>
          <thead>
            <tr className="text-xs uppercase tracking-[0.05em] text-hisa-muted">
              <th scope="col" className="px-2 py-[6px] text-left font-semibold">Network</th>
              {types.map((t) => (
                <th key={t} scope="col" className="px-2 py-[6px] text-center font-semibold">{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.by_network.map((n) => (
              <tr key={n.network}>
                <th scope="row" className="whitespace-nowrap px-2 py-[6px] text-left font-medium text-hisa-ink">{n.label}</th>
                {types.map((t) => {
                  const p = n.products.find((x) => x.type === t);
                  const has = !!p && p.count > 0;
                  const rate = has ? p.success_rate : null;
                  const fill = rateFill(rate);
                  const tip = cellTip(n.label, t, p);
                  return (
                    <td key={t} className="p-0">
                      <AntTooltip title={tip}>
                        <div
                          tabIndex={has ? 0 : -1}
                          aria-label={tip}
                          className="flex h-[46px] flex-col items-center justify-center rounded-[4px] outline-none focus-visible:ring-2 focus-visible:ring-hisa-ink"
                          style={{
                            background: fill ?? "#F9FAFB",
                            color: fill ? textOn(fill) : "#667085",
                          }}
                        >
                          <span className="font-mono text-[13px] font-medium leading-tight">{has ? formatRate(rate) : "—"}</span>
                          {has && p && (
                            <span className="font-mono text-[11px] leading-tight opacity-90">
                              {decidedCount(p) > 0
                                ? `${formatCount(p.successful_count)}/${formatCount(decidedCount(p))}`
                                : `${formatCount(p.pending_count)} pending`}
                            </span>
                          )}
                        </div>
                      </AntTooltip>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Scale legend */}
      <div className="flex flex-wrap items-center gap-x-[14px] gap-y-1 text-xs text-hisa-muted" aria-hidden="true">
        {RATE_BINS.map((b) => (
          <span key={b.label} className="inline-flex items-center gap-[6px]">
            <span className="inline-block h-[10px] w-[14px] rounded-[2px]" style={{ background: b.fill }} />
            {b.label}
          </span>
        ))}
        <span className="inline-flex items-center gap-[6px]">
          <span className="inline-block h-[10px] w-[14px] rounded-[2px] border-[1px] border-solid border-hisa-border bg-[#F9FAFB]" />
          No transactions / all pending
        </span>
        <span>· “62/63” = successful of completed</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Hourly volume: 24 stacked columns (successful | not successful)
// ---------------------------------------------------------------------------

interface HourRow {
  hour: number;
  label: string;
  successful: number;
  unsuccessful: number;
  count: number;
}

const HOUR_COLORS = { successful: CATEGORICAL[0], unsuccessful: CATEGORICAL[1] };

const hourRange = (h: number) => `${String(h).padStart(2, "0")}:00–${String(h).padStart(2, "0")}:59`;

const HourTip = ({ active, payload }: RechartsTipProps<HourRow>) => {
  const row = active ? payload?.[0]?.payload : undefined;
  if (!row) return null;
  return (
    <TipShell
      title={`${hourRange(row.hour)} · ${formatCount(row.count)} transactions`}
      rows={[
        { key: "s", color: HOUR_COLORS.successful, label: "successful", value: formatCount(row.successful) },
        { key: "u", color: HOUR_COLORS.unsuccessful, label: "not successful", value: formatCount(row.unsuccessful) },
      ]}
    />
  );
};

interface ShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  payload?: HourRow;
}

/** Rect with optional 4px rounded top; `gapTop` leaves the 2px surface gap. */
function columnPath(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.max(0, Math.min(r, w / 2, h));
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

const SuccessfulShape = (raw: unknown) => {
  const { x = 0, y = 0, width = 0, height = 0, fill, payload } = (raw ?? {}) as ShapeProps;
  if (height <= 0 || width <= 0) return <g />;
  const topSegmentShown = (payload?.unsuccessful ?? 0) > 0;
  const gap = topSegmentShown ? Math.min(2, height / 2) : 0;
  return <path d={columnPath(x, y + gap, width, height - gap, topSegmentShown ? 0 : 4)} fill={fill} />;
};

const UnsuccessfulShape = (raw: unknown) => {
  const { x = 0, y = 0, width = 0, height = 0, fill } = (raw ?? {}) as ShapeProps;
  if (height <= 0 || width <= 0) return <g />;
  return <path d={columnPath(x, y, width, height, 4)} fill={fill} />;
};

export const HourlyChart = ({ hours, printing }: { hours: DailyReport["by_hour"]; printing: boolean }) => {
  const rows: HourRow[] = hours.map((h) => ({
    hour: h.hour,
    label: String(h.hour).padStart(2, "0"),
    successful: h.successful_count,
    unsuccessful: Math.max(0, h.count - h.successful_count),
    count: h.count,
  }));
  const peak = rows.reduce<HourRow | null>((best, r) => (r.count > (best?.count ?? 0) ? r : best), null);

  return (
    <div className="flex flex-col gap-[10px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ul className="m-0 flex list-none flex-wrap gap-[14px] p-0 text-[13px] text-hisa-body" aria-label="Legend">
          <li className="inline-flex items-center gap-[6px]">
            <span aria-hidden="true" className="inline-block h-[10px] w-[10px] rounded-[2px]" style={{ background: HOUR_COLORS.successful }} />
            Successful
          </li>
          <li className="inline-flex items-center gap-[6px]">
            <span aria-hidden="true" className="inline-block h-[10px] w-[10px] rounded-[2px]" style={{ background: HOUR_COLORS.unsuccessful }} />
            Not successful (failed, pending, refunded)
          </li>
        </ul>
        {peak && (
          <span className="text-[13px] text-hisa-muted">
            Busiest hour: <span className="font-mono text-hisa-ink">{hourRange(peak.hour)}</span> ·{" "}
            <span className="font-mono text-hisa-ink">{formatCount(peak.count)}</span> transactions
          </span>
        )}
      </div>
      <div role="img" aria-label={`Transactions per hour, Lagos time.${peak ? ` Busiest hour ${hourRange(peak.hour)} with ${peak.count} transactions.` : ""}`}>
        <ChartBox height={240} printing={printing} printWidth={PRINT_FULL_WIDTH}>
          <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap="20%">
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "#D0D5DD" }}
              interval={printing ? 1 : 2}
              tick={{ fill: INK_SECONDARY, fontSize: 11, fontFamily: MONO }}
            />
            <YAxis
              width={40}
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => compactCount(v)}
              tick={{ fill: INK_SECONDARY, fontSize: 11, fontFamily: MONO }}
            />
            {!printing && <Tooltip cursor={{ fill: CURSOR }} content={<HourTip />} isAnimationActive={false} />}
            <Bar
              dataKey="successful"
              stackId="h"
              fill={HOUR_COLORS.successful}
              maxBarSize={20}
              isAnimationActive={false}
              shape={SuccessfulShape}
            />
            <Bar
              dataKey="unsuccessful"
              stackId="h"
              fill={HOUR_COLORS.unsuccessful}
              maxBarSize={20}
              isAnimationActive={false}
              shape={UnsuccessfulShape}
            />
          </BarChart>
        </ChartBox>
      </div>
      <details className="text-sm print:hidden">
        <summary className="cursor-pointer text-[13px] font-semibold text-hisa-primary">Show as table</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[360px] border-collapse text-sm">
            <caption className="sr-only">Transactions per hour (Lagos time)</caption>
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.05em] text-hisa-muted">
                <th scope="col" className="py-[6px] pr-2 font-semibold">Hour</th>
                <th scope="col" className="px-2 py-[6px] text-right font-semibold">Transactions</th>
                <th scope="col" className="px-2 py-[6px] text-right font-semibold">Successful</th>
                <th scope="col" className="py-[6px] pl-2 text-right font-semibold">Not successful</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.hour} className="border-t-[1px] border-solid border-[#F2F4F7]">
                  <th scope="row" className="py-[5px] pr-2 text-left font-mono font-normal text-hisa-body">{hourRange(r.hour)}</th>
                  <td className="px-2 py-[5px] text-right font-mono tabular-nums">{formatCount(r.count)}</td>
                  <td className="px-2 py-[5px] text-right font-mono tabular-nums">{formatCount(r.successful)}</td>
                  <td className="py-[5px] pl-2 text-right font-mono tabular-nums">{formatCount(r.unsuccessful)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
};
