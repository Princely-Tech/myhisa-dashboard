"use client";
import React, { useEffect, useId, useState } from "react";
import { Alert, Input, Popconfirm, Skeleton, message } from "antd";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { btnPrimary, btnSecondary } from "@/components/ui/styles";
import { isSandbox } from "@/utils/environment";
import { goLiveStorageKeys } from "@/app/dashboard/GoLiveChecklist";
import {
  MAX_IP_WHITELIST_ENTRIES,
  PartnerSettingsState,
  apiErrorMessage,
  validateIpOrCidr,
  writeFlag,
} from "./shared";

interface IpWhitelistTabProps {
  settings: PartnerSettingsState;
  userId?: number;
}

/**
 * Backend semantics (hisa_go_api middlewares.Auth + me/settings):
 * - The whitelist applies to API-key requests only; dashboard sessions
 *   (JWT) are never IP-checked.
 * - An empty list is stored as NULL = no whitelist = any IP may use the key.
 * - A change applies at once on the API server that saved it and on the
 *   others within the 60 s API-key cache TTL.
 */
const IpWhitelistTab = ({ settings, userId }: IpWhitelistTabProps) => {
  const [messageApi, contextHolder] = message.useMessage();
  const inputId = useId();
  const errorId = useId();
  const [list, setList] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const saved = settings.data?.ip_whitelist;
  useEffect(() => {
    if (saved) setList(saved);
  }, [saved]);

  const persist = async (next: string[], previous: string[], successText: string) => {
    setList(next); // optimistic
    setSaving(true);
    try {
      const result = await settings.save({ ip_whitelist: next });
      setList(result.ip_whitelist);
      if (result.ip_whitelist.length > 0 && userId !== undefined) {
        writeFlag(goLiveStorageKeys.ipsConfirmed(userId));
      }
      messageApi.success(successText);
      return true;
    } catch (err) {
      setList(previous); // rollback
      const msg = apiErrorMessage(err, "ip_whitelist", "Couldn't save the whitelist. Try again.");
      setFieldError(msg);
      messageApi.error(msg);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateIpOrCidr(draft);
    if (!check.ok) {
      setFieldError(check.error);
      return;
    }
    if (list.some((x) => x.toLowerCase() === check.value.toLowerCase())) {
      setFieldError(`${check.value} is already on the list.`);
      return;
    }
    if (list.length >= MAX_IP_WHITELIST_ENTRIES) {
      setFieldError(`You can add up to ${MAX_IP_WHITELIST_ENTRIES} addresses. Use a CIDR range to cover several.`);
      return;
    }
    setFieldError(null);
    const ok = await persist([...list, check.value], list, `${check.value} added`);
    if (ok) setDraft("");
  };

  const onRemove = (entry: string) => {
    setFieldError(null);
    persist(
      list.filter((x) => x !== entry),
      list,
      `${entry} removed`
    );
  };

  const scope = isSandbox ? "API calls" : "Live API calls";
  const full = list.length >= MAX_IP_WHITELIST_ENTRIES;

  return (
    <Card title="Allowed server IPs">
      {contextHolder}
      <p className="m-0 text-sm text-hisa-muted">
        {scope} made with your API key are accepted only from these addresses (single IPs or CIDR ranges, IPv4
        or IPv6). Leave empty to allow any IP. Dashboard sign-ins are not affected, and changes take effect
        within about a minute.
      </p>

      {settings.error && !settings.data ? (
        <Alert
          type="error"
          showIcon
          title="Couldn't load your whitelist."
          action={
            <button type="button" className={btnSecondary} onClick={() => settings.reload()}>
              Retry
            </button>
          }
        />
      ) : settings.loading && !settings.data ? (
        <Skeleton active paragraph={{ rows: 2 }} title={false} />
      ) : (
        <>
          {list.length === 0 ? (
            <EmptyState
              title="No whitelist: any IP can use your key"
              description="Add your servers' public IPs so a leaked key can't be used from anywhere else."
            />
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2 p-0" aria-label="Allowed IP addresses">
              {list.map((entry) => (
                <li
                  key={entry}
                  className="flex items-center justify-between gap-3 rounded-[10px] border-[1px] border-solid border-hisa-border px-[14px] py-[10px]"
                >
                  <span className="min-w-0 break-all font-mono text-sm text-hisa-ink">{entry}</span>
                  <Popconfirm
                    title={`Remove ${entry}?`}
                    description={
                      list.length === 1
                        ? "This is the last address: your key will then work from any IP."
                        : "API calls from this address will be rejected."
                    }
                    okText="Remove"
                    okButtonProps={{ danger: true }}
                    cancelText="Cancel"
                    onConfirm={() => onRemove(entry)}
                  >
                    <button
                      type="button"
                      className={`${btnSecondary} flex-none`}
                      aria-label={`Remove ${entry}`}
                      disabled={saving}
                    >
                      Remove
                    </button>
                  </Popconfirm>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={onAdd} className="flex flex-wrap items-end gap-[10px]" noValidate>
            <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-1">
              <label htmlFor={inputId} className="text-[13px] font-semibold text-hisa-body">
                IP or range
              </label>
              <Input
                id={inputId}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  if (fieldError) setFieldError(null);
                }}
                placeholder="e.g. 197.210.10.4 or 197.210.10.0/24"
                className="font-mono"
                autoComplete="off"
                spellCheck={false}
                inputMode="text"
                status={fieldError ? "error" : undefined}
                aria-invalid={!!fieldError}
                aria-describedby={errorId}
                disabled={full}
              />
            </div>
            <button type="submit" className={btnPrimary} disabled={saving || full || !draft.trim()}>
              {saving ? "Saving…" : "Add"}
            </button>
          </form>
          <p id={errorId} role={fieldError ? "alert" : undefined} className="m-0 text-[13px]">
            {fieldError ? (
              <span className="text-[#B42318]">{fieldError}</span>
            ) : (
              <span className="text-hisa-muted">
                {list.length} of {MAX_IP_WHITELIST_ENTRIES} used.
              </span>
            )}
          </p>
        </>
      )}
    </Card>
  );
};

export default IpWhitelistTab;
