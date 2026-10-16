"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { Skeleton } from "antd";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import routes from "@/utils/routes";
import type { AvailabilityItem } from "@/utils/types";
import Card from "@/components/ui/Card";
import { btnSecondary, textLink } from "@/components/ui/styles";
import { useAsync } from "./useAsync";

type State = "Operational" | "Degraded" | "Down";

// Same data source as app/availability (GET availability/all). Percent
// thresholds follow that page: >= 51 is "Acceptable" or better there.
const ROWS: { label: string; match: (i: AvailabilityItem) => boolean }[] = [
  { label: "MTN", match: (i) => isTelco(i) && i.provider === "mtn" },
  { label: "Airtel", match: (i) => isTelco(i) && i.provider === "airtel" },
  { label: "Glo", match: (i) => isTelco(i) && i.provider === "glo" },
  { label: "9mobile", match: (i) => isTelco(i) && (i.provider === "ninemobile" || i.provider === "9mobile") },
  { label: "Electricity", match: (i) => i.service === "electricity" },
  { label: "Cable TV", match: (i) => i.service === "cable" },
];

function isTelco(i: AvailabilityItem) {
  return i.service === "airtime" || i.service === "data";
}

function rollUp(items: AvailabilityItem[]): { state: State; affected: string[] } {
  const affected = items.filter((i) => i.percent < 51).map((i) => `${i.service} ${i.provider}`);
  if (items.every((i) => i.percent <= 0)) return { state: "Down", affected };
  if (affected.length > 0) return { state: "Degraded", affected };
  return { state: "Operational", affected };
}

const STATE_CLASS: Record<State, string> = {
  Operational: "text-[#067647]",
  Degraded: "text-[#B54708]",
  Down: "text-[#B42318]",
};

const ServiceStatus = () => {
  const { data, loading, error, reload } = useAsync<AvailabilityItem[]>(
    async () => {
      const res = await new AxiosHandler().get({ endPoint: apiEndpoints.availabilityAll });
      return Array.isArray(res?.data) ? (res.data as AvailabilityItem[]) : [];
    },
    true
  );

  // Refresh every 2 minutes, like the availability page.
  useEffect(() => {
    const id = setInterval(() => reload(), 2 * 60 * 1000);
    return () => clearInterval(id);
  }, [reload]);

  type Row = { label: string; state: State; affected: string[] };
  const rows: Row[] = [];
  for (const row of ROWS) {
    const items = (data ?? []).filter(row.match);
    if (items.length) rows.push({ label: row.label, ...rollUp(items) });
  }

  return (
    <Card
      title="Service status"
      actions={
        <Link href={routes.availability} className={`text-sm ${textLink}`}>
          Details
        </Link>
      }
    >
      {loading && !data ? (
        <Skeleton active title={false} paragraph={{ rows: 6 }} />
      ) : error && !data ? (
        <div className="flex flex-col items-start gap-2 text-sm text-hisa-muted">
          <span>Service status is unavailable right now.</span>
          <button type="button" className={btnSecondary} onClick={() => reload()}>
            Retry
          </button>
        </div>
      ) : rows.length === 0 ? (
        <p className="m-0 text-sm text-hisa-muted">No status data yet.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-[10px] p-0">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-hisa-body">{r.label}</span>
              <span
                className={`text-[13px] font-semibold ${STATE_CLASS[r.state]}`}
                title={r.affected.length ? `Affected: ${r.affected.join(", ")}` : undefined}
              >
                {r.state}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

export default ServiceStatus;
