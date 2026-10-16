"use client";
// "Daily email report" settings: GET/PUT <settings endpoint> (me/report-settings
// for partners, admin/partners/:id/report-settings for staff). Only the
// primary login (or staff with users.manage) can change them; everyone else
// gets a read-only summary.
import React, { useCallback, useEffect, useId, useState } from "react";
import { Alert, Checkbox, Select, Skeleton, Switch, message } from "antd";
import Card from "@/components/ui/Card";
import { btnPrimary, btnSecondary } from "@/components/ui/styles";
import AxiosHandler from "@/utils/api/axiosHandler";
import type { ReportSettings, ReportSettingsResponse, ReportSettingsUpdate } from "@/utils/types";
import { apiErrorMessage, formatReportDate } from "./reportUtils";

export const MAX_RECIPIENTS = 5;
const DEFAULT_SEND_HOUR = 8;
// Pragmatic check (the backend re-validates with its own rules).
const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]{2,}$/;

const hourLabel = (h: number) => `${String(h).padStart(2, "0")}:00`;
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => ({ value: h, label: hourLabel(h) }));

function normalize(d: Partial<ReportSettings> | null | undefined): ReportSettings {
  const hour = Number(d?.send_hour);
  return {
    daily_email_enabled: !!d?.daily_email_enabled,
    recipients: Array.isArray(d?.recipients) ? d!.recipients.filter((x): x is string => typeof x === "string") : [],
    send_hour: Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : DEFAULT_SEND_HOUR,
    include_csv: d?.include_csv === undefined || d?.include_csv === null ? true : !!d.include_csv,
    last_sent_date: d?.last_sent_date ?? null,
  };
}

function toUpdate(s: ReportSettings): ReportSettingsUpdate {
  return {
    daily_email_enabled: s.daily_email_enabled,
    recipients: s.recipients,
    send_hour: s.send_hour,
    include_csv: s.include_csv,
  };
}

const sameUpdate = (a: ReportSettings, b: ReportSettings) => JSON.stringify(toUpdate(a)) === JSON.stringify(toUpdate(b));

interface ReportSettingsCardProps {
  /** GET/PUT path relative to the API base. */
  endpoint: string;
  canEdit: boolean;
  /** Pre-filled recipient when the email is switched on with none. */
  defaultEmail?: string | null;
  /** Shown instead of the form when canEdit is false. */
  readOnlyNote?: React.ReactNode;
  id?: string;
}

const ReportSettingsCard = ({ endpoint, canEdit, defaultEmail, readOnlyNote, id }: ReportSettingsCardProps) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [data, setData] = useState<ReportSettings | null>(null);
  const [draft, setDraft] = useState<ReportSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const switchId = useId();
  const recipientsId = useId();
  const recipientsHelpId = useId();
  const hourId = useId();

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = (await new AxiosHandler().get({ endPoint: endpoint })) as ReportSettingsResponse | undefined;
      const next = normalize(res?.data);
      setData(next);
      setDraft(next);
    } catch (err) {
      setLoadError(apiErrorMessage(err, "Couldn't load the email report settings."));
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    load();
  }, [load]);

  // Deep link (#email-report, e.g. from the Developers area): the card
  // renders after the report, so scroll once it has its content.
  const ready = !loading;
  useEffect(() => {
    if (!ready || !id || window.location.hash !== `#${id}`) return;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [ready, id]);

  const patch = (p: Partial<ReportSettings>) => {
    setDraft((d) => (d ? { ...d, ...p } : d));
    if (error) setError(null);
  };

  const onToggle = (checked: boolean) => {
    if (!draft) return;
    const recipients =
      checked && draft.recipients.length === 0 && defaultEmail ? [defaultEmail.trim().toLowerCase()] : draft.recipients;
    patch({ daily_email_enabled: checked, recipients });
  };

  const onRecipients = (values: string[]) => {
    const cleaned: string[] = [];
    const invalid: string[] = [];
    for (const raw of values) {
      const v = raw.trim().toLowerCase();
      if (!v) continue;
      if (!EMAIL_RE.test(v)) invalid.push(raw.trim());
      else if (!cleaned.includes(v)) cleaned.push(v);
    }
    patch({ recipients: cleaned.slice(0, MAX_RECIPIENTS) });
    if (invalid.length) setError(`“${invalid[0]}” isn't a valid email address.`);
    else if (cleaned.length > MAX_RECIPIENTS) setError(`Add up to ${MAX_RECIPIENTS} recipients.`);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    if (draft.daily_email_enabled && draft.recipients.length === 0) {
      setError("Add at least one recipient to switch the daily email on.");
      return;
    }
    if (draft.recipients.length > MAX_RECIPIENTS) {
      setError(`Add up to ${MAX_RECIPIENTS} recipients.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = (await new AxiosHandler().put({ endPoint: endpoint, body: toUpdate(draft) })) as
        | ReportSettingsResponse
        | undefined;
      const next = normalize(res?.data ?? draft);
      // Keep last_sent_date if the PUT response leaves it out.
      if (!res?.data) next.last_sent_date = data?.last_sent_date ?? null;
      setData(next);
      setDraft(next);
      messageApi.success(next.daily_email_enabled ? `Daily email on — sent at ${hourLabel(next.send_hour)} (Lagos)` : "Daily email turned off");
    } catch (err) {
      const msg = apiErrorMessage(err, "Couldn't save the settings. Try again.", "recipients");
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const lastSent = data?.last_sent_date ? formatReportDate(data.last_sent_date) : "Not sent yet";

  return (
    <div id={id} className="scroll-mt-[90px] print:hidden">
      <Card title="Daily email report">
        {contextHolder}
        <p className="m-0 text-sm text-hisa-muted">
          Each morning we email the previous day&apos;s report (the same figures as this page) to the recipients
          below, with an optional CSV of every transaction.
        </p>

        {loadError && !data ? (
          <Alert
            type="error"
            showIcon
            title={loadError}
            action={
              <button type="button" className={btnSecondary} onClick={() => load()}>
                Retry
              </button>
            }
          />
        ) : loading && !data ? (
          <Skeleton active paragraph={{ rows: 3 }} title={false} />
        ) : !draft || !data ? null : !canEdit ? (
          <div className="flex flex-col gap-[10px]">
            <dl className="m-0 grid grid-cols-1 gap-x-[24px] gap-y-[10px] text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[13px] text-hisa-muted">Status</dt>
                <dd className="m-0 font-medium text-hisa-ink">{data.daily_email_enabled ? "On" : "Off"}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-hisa-muted">Send time</dt>
                <dd className="m-0 font-mono text-hisa-ink">{hourLabel(data.send_hour)} Lagos</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[13px] text-hisa-muted">Recipients</dt>
                <dd className="m-0 break-words text-hisa-ink">{data.recipients.length ? data.recipients.join(", ") : "—"}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-hisa-muted">CSV attached</dt>
                <dd className="m-0 text-hisa-ink">{data.include_csv ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-hisa-muted">Last sent</dt>
                <dd className="m-0 text-hisa-ink">{lastSent}</dd>
              </div>
            </dl>
            {readOnlyNote && <p className="m-0 text-[13px] text-hisa-muted">{readOnlyNote}</p>}
          </div>
        ) : (
          <form className="flex flex-col gap-[16px]" onSubmit={save} noValidate>
            <div className="flex items-center gap-[10px]">
              <Switch id={switchId} checked={draft.daily_email_enabled} onChange={onToggle} />
              <label htmlFor={switchId} className="cursor-pointer text-sm font-semibold text-hisa-ink">
                Email the daily report
              </label>
              <span className="ml-auto text-[13px] text-hisa-muted">Last sent: {lastSent}</span>
            </div>

            <div className={`grid grid-cols-1 gap-[14px] md:grid-cols-[minmax(0,1fr)_200px] ${draft.daily_email_enabled ? "" : "opacity-70"}`}>
              <div className="flex min-w-0 flex-col gap-1">
                <label htmlFor={recipientsId} className="text-[13px] font-semibold text-hisa-body">
                  Recipients <span className="font-normal text-hisa-muted">(up to {MAX_RECIPIENTS})</span>
                </label>
                <Select<string[]>
                  id={recipientsId}
                  mode="tags"
                  open={false}
                  suffixIcon={null}
                  tokenSeparators={[",", ";", " "]}
                  value={draft.recipients}
                  onChange={onRecipients}
                  maxCount={MAX_RECIPIENTS}
                  placeholder="ops@yourcompany.com"
                  status={error ? "error" : undefined}
                  aria-describedby={recipientsHelpId}
                  className="w-full"
                />
                <span id={recipientsHelpId} className="text-xs text-hisa-muted">
                  Type an address and press Enter or comma.
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor={hourId} className="text-[13px] font-semibold text-hisa-body">
                  Send at <span className="font-normal text-hisa-muted">(Lagos time)</span>
                </label>
                <Select<number>
                  id={hourId}
                  value={draft.send_hour}
                  onChange={(v) => patch({ send_hour: v })}
                  options={HOUR_OPTIONS}
                  className="w-full"
                />
              </div>
            </div>

            <Checkbox checked={draft.include_csv} onChange={(e) => patch({ include_csv: e.target.checked })}>
              Attach the CSV of every transaction
            </Checkbox>

            {error && (
              <p role="alert" className="m-0 text-[13px] text-[#B42318]">
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-[10px]">
              <button type="submit" className={btnPrimary} disabled={saving || sameUpdate(draft, data)}>
                {saving ? "Saving…" : "Save"}
              </button>
              {!sameUpdate(draft, data) && (
                <button
                  type="button"
                  className={btnSecondary}
                  disabled={saving}
                  onClick={() => {
                    setDraft(data);
                    setError(null);
                  }}
                >
                  Discard changes
                </button>
              )}
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default ReportSettingsCard;
