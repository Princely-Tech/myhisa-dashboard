"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckOutlined } from "@ant-design/icons";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import routes from "@/utils/routes";
import type { CreditHistory, User, WebhookResponse } from "@/utils/types";
import { isSandbox } from "@/utils/environment";
import { btnSecondary, textLink } from "@/components/ui/styles";
import { useAsync } from "./useAsync";

// localStorage keys (per user id). The API-key flag is only a fallback for
// backends that don't report has_api_key on /me.
export const goLiveStorageKeys = {
  dismissed: (id: number) => `hisa:golive-dismissed:${id}`,
  apiKeyViewed: (id: number) => `hisa:apikey-viewed:${id}`,
  ipsConfirmed: (id: number) => `hisa:ips-confirmed:${id}`,
};

function readFlag(key: string): boolean {
  try {
    return !!localStorage.getItem(key);
  } catch {
    return false;
  }
}

function writeFlag(key: string) {
  try {
    localStorage.setItem(key, new Date().toISOString());
  } catch {
    // storage unavailable - the flag just won't persist
  }
}

interface Task {
  key: string;
  label: string;
  /** null = still loading / unknown. */
  done: boolean | null;
  action?: React.ReactNode;
}

interface GoLiveChecklistProps {
  /** Fresh /me user (falls back to the cached session user). */
  user: User;
  /** history?per_page=... total_records, null while loading. */
  transactionCount: number | null;
  onFund: () => void;
}

/** Rendered only for approved primary logins (see app/dashboard/page.tsx). */
const GoLiveChecklist = ({ user, transactionCount, onFund }: GoLiveChecklistProps) => {
  const [dismissed, setDismissed] = useState<boolean | null>(null);
  const [apiKeyViewed, setApiKeyViewed] = useState(false);
  const [ipsConfirmed, setIpsConfirmed] = useState(false);

  useEffect(() => {
    setDismissed(readFlag(goLiveStorageKeys.dismissed(user.id)));
    setApiKeyViewed(readFlag(goLiveStorageKeys.apiKeyViewed(user.id)));
    setIpsConfirmed(readFlag(goLiveStorageKeys.ipsConfirmed(user.id)));
  }, [user.id]);

  const enabled = dismissed === false;

  const credits = useAsync<number>(
    async () => {
      const res = await new AxiosHandler().get({ endPoint: `${apiEndpoints.creditHistory}?per_page=1` });
      const data = res?.data as CreditHistory | undefined;
      return data?.total_records ?? data?.records?.length ?? 0;
    },
    enabled
  );

  const webhooks = useAsync<number>(
    async () => {
      const res = (await new AxiosHandler().get({ endPoint: apiEndpoints.webhooks })) as WebhookResponse | undefined;
      const list = res?.data;
      if (Array.isArray(list)) return list.length;
      return list ? 1 : 0;
    },
    enabled
  );

  if (!enabled) return null;

  const balance = user.wallet?.balance ?? 0;
  const funded: boolean | null =
    balance > 0 ? true : credits.data !== null ? credits.data > 0 : credits.error ? false : null;

  const tasks: Task[] = [
    { key: "email", label: "Verify your email", done: !!user.email_verified_at },
    {
      key: "approved",
      label: "Business approved",
      done: !!user.approved_at,
      action: <Link href={routes.profile} className={textLink}>View</Link>,
    },
    {
      key: "fund",
      label: "Fund your wallet",
      done: funded,
      action: (
        <button type="button" onClick={onFund} className={`border-0 bg-transparent p-0 text-sm ${textLink}`}>
          Fund
        </button>
      ),
    },
    {
      key: "apikey",
      label: isSandbox ? "Get your sandbox API key" : "Get your live API key",
      // Every account gets a key at signup (users.api_key is NOT NULL), so
      // this is done whenever /me says a key exists. Older backends don't send
      // has_api_key: then an approved account, a live transaction, or a key
      // viewed in this browser counts as done.
      done:
        user.has_api_key ??
        (apiKeyViewed || !!user.approved_at || (transactionCount ?? 0) > 0),
      action: <Link href={routes.apiKeys} className={textLink}>Get key</Link>,
    },
    {
      // Done once /me reports whitelist entries (onboarding-v2 backend), or
      // when the partner marks it done (e.g. they deliberately allow any IP).
      key: "ips",
      label: "Add server IPs to the whitelist",
      done: ipsConfirmed || (user.ip_whitelist?.length ?? 0) > 0,
      action: (
        <span className="flex items-center gap-3">
          <Link href={routes.apiKeysTab("ip-whitelist")} className={textLink}>Add IPs</Link>
          <button
            type="button"
            className={`border-0 bg-transparent p-0 text-sm ${textLink}`}
            onClick={() => {
              writeFlag(goLiveStorageKeys.ipsConfirmed(user.id));
              setIpsConfirmed(true);
            }}
          >
            Mark done
          </button>
        </span>
      ),
    },
    {
      key: "webhook",
      label: "Set up a webhook",
      done: webhooks.data !== null ? webhooks.data > 0 : webhooks.error ? false : null,
      action: <Link href={routes.apiKeysTab("webhooks")} className={textLink}>Set up</Link>,
    },
    {
      key: "firsttx",
      label: isSandbox ? "Make your first test transaction" : "Make your first live transaction",
      done: transactionCount === null ? null : transactionCount > 0,
      action: <Link href={routes.testTransactions} className={textLink}>Try it</Link>,
    },
  ];

  const doneCount = tasks.filter((t) => t.done === true).length;
  const pct = Math.round((doneCount / tasks.length) * 100);

  return (
    <section
      aria-labelledby="golive-heading"
      className="flex flex-col gap-4 rounded-2xl border-[1px] border-solid border-hisa-border bg-white px-[20px] py-[22px] sm:px-[24px]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="golive-heading" className="m-0 font-heading text-lg font-bold text-hisa-ink">
            {doneCount === tasks.length ? "You're live. Nice work" : "You're approved. Finish going live"}
          </h2>
          <span className="text-sm text-hisa-muted">
            {doneCount} of {tasks.length} done
          </span>
        </div>
        <button
          type="button"
          className={btnSecondary}
          onClick={() => {
            writeFlag(goLiveStorageKeys.dismissed(user.id));
            setDismissed(true);
          }}
        >
          Hide checklist
        </button>
      </div>
      <div
        role="progressbar"
        aria-label="Go-live progress"
        aria-valuemin={0}
        aria-valuemax={tasks.length}
        aria-valuenow={doneCount}
        className="h-2 overflow-hidden rounded-full bg-hisa-border"
      >
        <div className="h-2 bg-[#079455] transition-[width]" style={{ width: `${pct}%` }} />
      </div>
      <ul className="m-0 grid list-none grid-cols-1 gap-[10px] p-0 sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
        {tasks.map((task) => {
          const done = task.done === true;
          return (
            <li
              key={task.key}
              className={`flex items-center gap-[10px] rounded-[10px] border-[1px] border-solid px-[12px] py-[10px] ${
                done ? "border-[#D1FADF] bg-[#F6FEF9]" : "border-hisa-border bg-white"
              }`}
            >
              <span
                aria-hidden="true"
                className={`flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full text-[12px] ${
                  done
                    ? "bg-[#079455] text-white"
                    : task.done === null
                    ? "border-2 border-dashed border-[#D0D5DD]"
                    : "border-2 border-solid border-[#D0D5DD]"
                }`}
              >
                {done && <CheckOutlined />}
              </span>
              <span
                className={`min-w-0 flex-1 text-sm ${
                  done ? "text-hisa-muted line-through" : "font-semibold text-hisa-ink"
                }`}
              >
                {task.label}
                <span className="sr-only">{done ? " (done)" : task.done === null ? " (checking)" : " (to do)"}</span>
              </span>
              {!done && task.done !== null && task.action && (
                <span className="flex-none text-sm">{task.action}</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default GoLiveChecklist;
