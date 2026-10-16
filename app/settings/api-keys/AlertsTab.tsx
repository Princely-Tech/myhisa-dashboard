"use client";
import React, { useEffect, useId, useState } from "react";
import { Alert, InputNumber, Skeleton, message } from "antd";
import Card from "@/components/ui/Card";
import { btnPrimary, btnSecondary } from "@/components/ui/styles";
import { formatNaira, nairaToKobo } from "@/utils/format";
import { useShell } from "@/components/shell/ShellContext";
import { PartnerSettingsState, apiErrorMessage } from "./shared";

/** Backend cap: 10,000,000,000,000 kobo (controllers/me/settings.go). */
const MAX_NAIRA = 100_000_000_000;

interface AlertsTabProps {
  settings: PartnerSettingsState;
}

const AlertsTab = ({ settings }: AlertsTabProps) => {
  const [messageApi, contextHolder] = message.useMessage();
  const { refreshMe } = useShell();
  const inputId = useId();
  const helpId = useId();
  const [value, setValue] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentKobo = settings.data?.low_balance_threshold ?? null;
  useEffect(() => {
    if (currentKobo !== null) setValue(currentKobo > 0 ? currentKobo / 100 : null);
  }, [currentKobo]);

  const save = async (naira: number | null) => {
    const kobo = naira && naira > 0 ? nairaToKobo(naira) : 0;
    if (naira !== null && (naira < 0 || naira > MAX_NAIRA)) {
      setError(`Enter an amount between ₦0 and ${formatNaira(MAX_NAIRA * 100, { decimals: 0 })}.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await settings.save({ low_balance_threshold: kobo });
      messageApi.success(
        result.low_balance_threshold > 0
          ? `Alert set at ${formatNaira(result.low_balance_threshold)}`
          : "Low-balance alert turned off"
      );
      // The dashboard banner reads low_balance_threshold from /me.
      refreshMe();
    } catch (err) {
      const msg = apiErrorMessage(err, "low_balance_threshold", "Couldn't save the alert. Try again.");
      setError(msg);
      messageApi.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const dirty = currentKobo !== null && (value && value > 0 ? nairaToKobo(value) : 0) !== currentKobo;

  return (
    <Card title="Low-balance alert">
      {contextHolder}
      <p className="m-0 text-sm text-hisa-muted">
        Dashboard alert: when your main wallet falls below this amount, the dashboard shows a banner so you can
        top up before transactions start failing. Leave empty or set ₦0 to turn it off.
      </p>

      {settings.error && !settings.data ? (
        <Alert
          type="error"
          showIcon
          title="Couldn't load your alert settings."
          action={
            <button type="button" className={btnSecondary} onClick={() => settings.reload()}>
              Retry
            </button>
          }
        />
      ) : settings.loading && !settings.data ? (
        <Skeleton active paragraph={{ rows: 1 }} title={false} />
      ) : (
        <form
          className="flex flex-col gap-[10px]"
          onSubmit={(e) => {
            e.preventDefault();
            save(value);
          }}
        >
          <div className="flex flex-wrap items-end gap-[10px]">
            <div className="flex min-w-0 flex-[0_1_280px] flex-col gap-1">
              <label htmlFor={inputId} className="text-[13px] font-semibold text-hisa-body">
                Alert me below (₦)
              </label>
              <InputNumber<number>
                id={inputId}
                className="w-full"
                prefix="₦"
                min={0}
                max={MAX_NAIRA}
                step={1000}
                precision={2}
                value={value}
                onChange={(v) => {
                  setValue(v);
                  if (error) setError(null);
                }}
                formatter={(v) => (v === undefined || v === null || `${v}` === "" ? "" : `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ","))}
                parser={(v) => Number((v ?? "").replace(/[₦,\s]/g, "")) || 0}
                placeholder="e.g. 50,000"
                status={error ? "error" : undefined}
                aria-describedby={helpId}
              />
            </div>
            <button type="submit" className={btnPrimary} disabled={saving || !dirty}>
              {saving ? "Saving…" : "Save"}
            </button>
            {currentKobo !== null && currentKobo > 0 && (
              <button type="button" className={btnSecondary} disabled={saving} onClick={() => save(null)}>
                Turn off
              </button>
            )}
          </div>
          <p id={helpId} role={error ? "alert" : undefined} className="m-0 text-[13px]">
            {error ? (
              <span className="text-[#B42318]">{error}</span>
            ) : (
              <span className="text-hisa-muted">
                Current:{" "}
                {currentKobo && currentKobo > 0 ? `alert below ${formatNaira(currentKobo)}` : "off"}
              </span>
            )}
          </p>
        </form>
      )}
    </Card>
  );
};

export default AlertsTab;
