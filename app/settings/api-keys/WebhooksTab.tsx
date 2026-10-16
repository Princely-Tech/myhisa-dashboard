"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Alert, Form, Input, Modal, Popconfirm, Skeleton, Switch, message } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  HistoryOutlined,
  PlusOutlined,
  SendOutlined,
} from "@ant-design/icons";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import routes from "@/utils/routes";
import type { WebhookItem, WebhookResponse, WebhookTestResult } from "@/utils/types";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import StatusPill from "@/components/ui/StatusPill";
import { btnDanger, btnPrimary, btnSecondary, textLink } from "@/components/ui/styles";
import { formatLagosDateTime } from "@/utils/format";
import { apiErrorMessage } from "./shared";

// What partner webhooks deliver today (hisa_go_api services/webhook_notifier.go
// determineEventType): service availability changes only, sent to every
// active endpoint with header X-Webhook-Event: service_status_change. There
// is no per-endpoint event subscription and no transaction events yet.
const SUPPORTED_EVENTS = [
  "service_down",
  "service_restored",
  "service_critical",
  "service_degraded",
  "service_unstable",
  "service_acceptable",
  "service_healthy",
];

// POST webhooks/:id/test sends {"event":"test"} synchronously through the
// backend's SSRF-safe client (10 s timeout, 10 tests/min per account),
// records a delivery and answers 200 even when the delivery failed.
type TestOutcome =
  | { kind: "result"; result: WebhookTestResult; latencyMs: number }
  | { kind: "error"; text: string };

function describeTestError(err: unknown): string {
  const status = (err as { response?: { status?: number } } | null)?.response?.status;
  if (status === 429) return "Too many test events. You can send 10 per minute; try again shortly.";
  if (status === 404) return "This webhook no longer exists. Refresh the list.";
  return apiErrorMessage(err, undefined, "Couldn't send the test event. Try again.");
}

interface WebhookFormValues {
  webhook_url: string;
  auth_token?: string;
  description?: string;
}

function isHttpsUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === "https:" && !!u.hostname;
  } catch {
    return false;
  }
}

function toList(data: WebhookResponse["data"] | undefined): WebhookItem[] {
  if (Array.isArray(data)) return data;
  return data ? [data] : [];
}

const TestOutcomeView = ({ outcome, webhookId }: { outcome?: TestOutcome; webhookId: number }) => {
  if (!outcome) return null;
  if (outcome.kind === "error") {
    return (
      <p role="alert" className="m-0 rounded-[10px] bg-[#FEF3F2] px-[12px] py-[10px] text-[13px] text-[#B42318]">
        {outcome.text}
      </p>
    );
  }
  const { result, latencyMs } = outcome;
  const ok = result.success;
  return (
    <div
      className={`flex flex-col gap-1 rounded-[10px] px-[12px] py-[10px] text-[13px] ${
        ok ? "bg-[#F6FEF9] text-[#067647]" : "bg-[#FEF3F2] text-[#B42318]"
      }`}
    >
      <span className="font-semibold">
        {ok ? "Test event delivered" : result.status === "skipped" ? "Test event not sent" : "Test event failed"}
      </span>
      <span className="text-hisa-body">
        HTTP status: <span className="font-mono">{result.response_code > 0 ? result.response_code : "none"}</span>
        {" · "}Round trip: <span className="font-mono">{latencyMs} ms</span>
        <span className="text-hisa-muted"> (includes our server)</span>
      </span>
      {result.error_message && (
        <span className="break-words">
          Error: <span className="font-mono">{result.error_message}</span>
        </span>
      )}
      {result.response_body && (
        <span className="break-all text-hisa-muted">
          Response: <span className="font-mono">{result.response_body.slice(0, 300)}</span>
        </span>
      )}
      <Link href={routes.webhookDeliveries(String(webhookId))} className={`self-start ${textLink}`}>
        View in deliveries
      </Link>
    </div>
  );
};

const WebhooksTab = () => {
  const [messageApi, contextHolder] = message.useMessage();
  // Silent handler: messages come from apiErrorMessage below, because the
  // webhook endpoints answer errors with {"error": ...} (no "message").
  const api = useMemo(() => new AxiosHandler(), []);
  const [form] = Form.useForm<WebhookFormValues>();

  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editing, setEditing] = useState<WebhookItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [testOutcomes, setTestOutcomes] = useState<Record<number, TestOutcome>>({});

  const onTest = async (w: WebhookItem) => {
    setTestingId(w.id);
    setTestOutcomes((o) => {
      const next = { ...o };
      delete next[w.id];
      return next;
    });
    const started = performance.now();
    let outcome: TestOutcome;
    try {
      const res = (await api.post({ endPoint: apiEndpoints.webhookTest(w.id), body: {} })) as
        | { data?: WebhookTestResult }
        | undefined;
      if (!res?.data) throw new Error("empty test response");
      outcome = { kind: "result", result: res.data, latencyMs: Math.round(performance.now() - started) };
    } catch (err) {
      outcome = { kind: "error", text: describeTestError(err) };
    }
    setTestOutcomes((o) => ({ ...o, [w.id]: outcome }));
    setTestingId(null);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = (await api.get({ endPoint: apiEndpoints.webhooks })) as WebhookResponse | undefined;
      setWebhooks(toList(res?.data));
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setFormOpen(true);
  };

  const openEdit = (w: WebhookItem) => {
    setEditing(w);
    form.setFieldsValue({ webhook_url: w.webhook_url, auth_token: "", description: w.description ?? "" });
    setFormOpen(true);
  };

  const closeForm = () => {
    if (submitting) return;
    setFormOpen(false);
    setEditing(null);
  };

  const onSubmit = async (values: WebhookFormValues) => {
    setSubmitting(true);
    const body: Record<string, string> = {
      webhook_url: values.webhook_url.trim(),
      description: (values.description ?? "").trim(),
    };
    const token = (values.auth_token ?? "").trim();
    if (token) body.auth_token = token;
    try {
      if (editing) {
        await api.put({ endPoint: apiEndpoints.webhookById(editing.id), body });
        messageApi.success("Webhook updated");
      } else {
        await api.post({ endPoint: apiEndpoints.webhooks, body });
        messageApi.success("Webhook added");
      }
      setFormOpen(false);
      setEditing(null);
      load();
    } catch (err) {
      messageApi.error(apiErrorMessage(err, undefined, "Couldn't save the webhook. Try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const onToggle = async (w: WebhookItem, next: boolean) => {
    setBusyId(w.id);
    setWebhooks((list) => list.map((x) => (x.id === w.id ? { ...x, is_active: next } : x)));
    try {
      await api.put({ endPoint: apiEndpoints.webhookById(w.id), body: { is_active: next } });
      messageApi.success(next ? "Webhook enabled" : "Webhook paused");
    } catch (err) {
      setWebhooks((list) => list.map((x) => (x.id === w.id ? { ...x, is_active: !next } : x)));
      messageApi.error(apiErrorMessage(err, undefined, "Couldn't update the webhook. Try again."));
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (w: WebhookItem) => {
    setBusyId(w.id);
    try {
      await api.delete({ endPoint: apiEndpoints.webhookById(w.id), body: {} });
      setWebhooks((list) => list.filter((x) => x.id !== w.id));
      messageApi.success("Webhook deleted");
    } catch (err) {
      messageApi.error(apiErrorMessage(err, undefined, "Couldn't delete the webhook. Try again."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-[18px]">
      {contextHolder}
      <Card
        title="Webhook endpoints"
        actions={
          webhooks.length > 0 ? (
            <button type="button" className={btnPrimary} onClick={openCreate}>
              <PlusOutlined aria-hidden="true" /> Add endpoint
            </button>
          ) : undefined
        }
      >
        <p className="m-0 text-sm text-hisa-muted">
          We POST JSON to each enabled endpoint with your token in the{" "}
          <span className="font-mono">Authorization: Bearer</span> header, so you can check the request came
          from us.
        </p>

        {loadError ? (
          <Alert
            type="error"
            showIcon
            title="Couldn't load your webhooks."
            action={
              <button type="button" className={btnSecondary} onClick={load}>
                Retry
              </button>
            }
          />
        ) : loading && webhooks.length === 0 ? (
          <Skeleton active paragraph={{ rows: 3 }} title={false} />
        ) : webhooks.length === 0 ? (
          <EmptyState
            title="No webhooks yet"
            description="Add an HTTPS endpoint to be notified when a network or biller goes down or recovers."
            action={
              <button type="button" className={btnPrimary} onClick={openCreate}>
                <PlusOutlined aria-hidden="true" /> Add endpoint
              </button>
            }
          />
        ) : (
          <ul className="m-0 flex list-none flex-col gap-[10px] p-0">
            {webhooks.map((w) => (
              <li
                key={w.id}
                className="flex flex-col gap-[10px] rounded-[12px] border-[1px] border-solid border-hisa-border p-[14px]"
              >
                <div className="flex flex-wrap items-start justify-between gap-[10px]">
                  <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1">
                    <span className="break-all font-mono text-sm text-hisa-ink">{w.webhook_url}</span>
                    {w.description && <span className="text-[13px] text-hisa-muted">{w.description}</span>}
                    <span className="text-xs text-hisa-muted">
                      Added {formatLagosDateTime(w.created_at)}
                      {w.updated_at && w.updated_at !== w.created_at
                        ? ` · Updated ${formatLagosDateTime(w.updated_at)}`
                        : ""}
                    </span>
                  </div>
                  <div className="flex flex-none items-center gap-2">
                    <StatusPill
                      tone={w.is_active ? "success" : "refunded"}
                      label={w.is_active ? "Enabled" : "Paused"}
                    />
                    <Switch
                      checked={w.is_active}
                      loading={busyId === w.id}
                      onChange={(checked) => onToggle(w, checked)}
                      aria-label={`${w.is_active ? "Pause" : "Enable"} ${w.webhook_url}`}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={routes.webhookDeliveries(String(w.id))}
                    className={btnSecondary}
                    aria-label={`Deliveries for ${w.webhook_url}`}
                  >
                    <HistoryOutlined aria-hidden="true" /> Deliveries
                  </Link>
                  <button
                    type="button"
                    className={btnSecondary}
                    onClick={() => onTest(w)}
                    disabled={testingId !== null}
                    aria-label={`Send test event to ${w.webhook_url}`}
                  >
                    <SendOutlined aria-hidden="true" /> {testingId === w.id ? "Sending…" : "Send test event"}
                  </button>
                  <button
                    type="button"
                    className={btnSecondary}
                    onClick={() => openEdit(w)}
                    aria-label={`Edit ${w.webhook_url}`}
                  >
                    <EditOutlined aria-hidden="true" /> Edit
                  </button>
                  <Popconfirm
                    title="Delete this webhook?"
                    description="We'll stop sending events to it."
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                    cancelText="Cancel"
                    onConfirm={() => onDelete(w)}
                  >
                    <button
                      type="button"
                      className={btnDanger}
                      disabled={busyId === w.id}
                      aria-label={`Delete ${w.webhook_url}`}
                    >
                      <DeleteOutlined aria-hidden="true" /> Delete
                    </button>
                  </Popconfirm>
                </div>
                <div aria-live="polite">
                  <TestOutcomeView outcome={testOutcomes[w.id]} webhookId={w.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Events">
        <p className="m-0 text-sm text-hisa-muted">
          Every enabled endpoint receives service status changes (header{" "}
          <span className="font-mono">X-Webhook-Event: service_status_change</span>). Transaction and wallet
          events aren&apos;t available yet; use the transaction query endpoints for final statuses.
        </p>
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Event types sent">
          {SUPPORTED_EVENTS.map((e) => (
            <li
              key={e}
              className="rounded-full border-[1px] border-solid border-hisa-primary bg-hisa-primary-soft px-[12px] py-[6px] font-mono text-[13px] text-hisa-primary-hover"
            >
              {e}
            </li>
          ))}
        </ul>
        <p className="m-0 text-[13px] text-hisa-muted">
          Payload fields: event_type, service, provider, previous_state and new_state (availability %), timestamp, note.{" "}
          <Link href={routes.documentation} className={textLink}>
            API documentation
          </Link>
        </p>
      </Card>

      <Modal
        open={formOpen}
        title={editing ? "Edit webhook" : "Add webhook endpoint"}
        okText={editing ? "Save changes" : "Add endpoint"}
        okButtonProps={{ loading: submitting }}
        cancelButtonProps={{ disabled: submitting }}
        onOk={() => form.submit()}
        onCancel={closeForm}
        forceRender
      >
        <Form<WebhookFormValues> form={form} layout="vertical" onFinish={onSubmit} requiredMark="optional">
          <Form.Item
            label="Endpoint URL"
            name="webhook_url"
            rules={[
              { required: true, whitespace: true, message: "Enter your endpoint URL." },
              {
                validator: (_, value: string | undefined) =>
                  !value || isHttpsUrl(value)
                    ? Promise.resolve()
                    : Promise.reject(new Error("Use a full https:// URL.")),
              },
            ]}
          >
            <Input
              placeholder="https://api.yourcompany.ng/hooks/hisa"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
            />
          </Form.Item>
          <Form.Item
            label="Auth token"
            name="auth_token"
            extra={
              editing
                ? "Leave blank to keep the current token."
                : "Sent as Authorization: Bearer <token> on every request. Use a long random value."
            }
            rules={editing ? [] : [{ required: true, whitespace: true, message: "Enter an auth token." }]}
          >
            <Input.Password autoComplete="new-password" placeholder={editing ? "••••••••" : undefined} />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} placeholder="e.g. Production status alerts" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WebhooksTab;
