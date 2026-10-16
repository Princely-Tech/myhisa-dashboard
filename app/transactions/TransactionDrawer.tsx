"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Drawer, Skeleton, message } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import routes from "@/utils/routes";
import type { TransactionItem, TransactionTelcoLog } from "@/utils/types";
import { formatLagosDateTime, formatNaira, toLagos } from "@/utils/format";
import { isRequeryable, networkLabel, serviceTitle, statusTone } from "@/utils/transactions";
import StatusPill, { describeStatus, type StatusTone } from "@/components/ui/StatusPill";
import CopyButton from "@/components/ui/CopyButton";
import { btnPrimary, btnSecondary, focusRing, textLink } from "@/components/ui/styles";
import ReceiptModal from "@/components/receipt/ReceiptModal";
import SandboxResolveActions, { isSandboxResolvable } from "@/components/SandboxResolveActions";

// One row of self-service/transactions/by-refs. That endpoint (owner-scoped)
// is used rather than GET transaction/:id because it returns the full telco
// log, including its created_at/updated_at for the timeline.
interface ByRefResult {
  status: "found" | "error";
  transaction?: TransactionItem;
  telco_log?: TransactionTelcoLog | null;
  message?: string;
}

// One row of self-service/transactions/query-and-update-status.
interface RequeryResult {
  status: "updated" | "unchanged" | "skipped" | "error";
  old_status?: string;
  new_status?: string | null;
  message?: string;
}

function useIsMobile(query = "(max-width: 639px)"): boolean {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return mobile;
}

const DOT: Record<StatusTone | "neutral", string> = {
  success: "bg-[#079455]",
  pending: "bg-[#F79009]",
  failed: "bg-[#D92D20]",
  refunded: "bg-[#667085]",
  neutral: "bg-[#079455]",
};

interface TimelineStep {
  key: string;
  label: string;
  at: string;
  detail?: string;
  tone: StatusTone | "neutral";
}

function buildTimeline(tx: TransactionItem, log: TransactionTelcoLog | null): TimelineStep[] {
  const provider = networkLabel(tx.network) || "the provider";
  const steps: TimelineStep[] = [];
  const valid = (v?: string | null): v is string => !!v && toLagos(v).isValid() && !v.startsWith("0001-");

  if (valid(tx.created_at)) steps.push({ key: "created", label: "Request received", at: tx.created_at, tone: "neutral" });
  if (valid(tx.billed_at)) {
    steps.push({ key: "billed", label: "Wallet debited", at: tx.billed_at, tone: "neutral" });
  }
  const retries = (tx.retry_refs_to_telco ?? "").split(",").map((r) => r.trim()).filter(Boolean).length;
  if (valid(tx.attempt_sent_at)) {
    steps.push({
      key: "sent",
      label: `Sent to ${provider}`,
      at: tx.attempt_sent_at,
      detail: retries > 0 ? `Retried ${retries} ${retries === 1 ? "time" : "times"}` : undefined,
      tone: "neutral",
    });
  } else if (log && valid(log.created_at)) {
    steps.push({
      key: "sent",
      label: `Sent to ${provider}`,
      at: log.created_at,
      detail: retries > 0 ? `Retried ${retries} ${retries === 1 ? "time" : "times"}` : undefined,
      tone: "neutral",
    });
  }
  if (log && log.status) {
    const at = valid(log.updated_at) ? log.updated_at : valid(log.created_at) ? log.created_at : null;
    if (at) {
      const d = describeStatus(log.status);
      steps.push({
        key: "response",
        label: `${provider.charAt(0).toUpperCase()}${provider.slice(1)}: ${d.label.toLowerCase()}`,
        at,
        detail: log.response_message || undefined,
        tone: d.tone,
      });
    }
  }
  if (valid(tx.refunded_at)) {
    steps.push({ key: "refunded", label: "Refunded to your wallet", at: tx.refunded_at, tone: "refunded" });
  }
  if (valid(tx.reconciled_at)) {
    steps.push({ key: "reconciled", label: "Reconciled", at: tx.reconciled_at, tone: "neutral" });
  }
  return steps.sort((a, b) => toLagos(a.at).valueOf() - toLagos(b.at).valueOf());
}

interface TransactionDrawerProps {
  /** Row the drawer was opened from (shown immediately, then refreshed). */
  transaction: TransactionItem | null;
  open: boolean;
  onClose: () => void;
  /** Called with the fresh record after a status check / sandbox resolve. */
  onUpdated: (tx: TransactionItem) => void;
  /** Element to return focus to once the drawer has closed. */
  returnFocusTo?: HTMLElement | null;
}

const TransactionDrawer = ({ transaction, open, onClose, onUpdated, returnFocusTo }: TransactionDrawerProps) => {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [messageApi, contextHolder] = message.useMessage();
  const [detail, setDetail] = useState<{ id: string; tx: TransactionItem; log: TransactionTelcoLog | null } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const currentId = transaction?.transaction_id ?? "";
  const latestId = useRef(currentId);
  latestId.current = currentId;
  const onUpdatedRef = useRef(onUpdated);
  onUpdatedRef.current = onUpdated;

  const loadDetail = useCallback(async (id: string, notify = false) => {
    if (!id) return;
    setDetailLoading(true);
    try {
      // Silent handler: the row data is already on screen, so a failed
      // enrichment should not toast.
      const res = await new AxiosHandler().get({
        endPoint: `${apiEndpoints.selfServiceTransactionsByRefs}?transaction_refs=${encodeURIComponent(id)}`,
      });
      const rows: ByRefResult[] = Array.isArray(res?.data) ? res.data : [];
      // by-refs tries external_ref before transaction_id; keep only the row
      // that really is this transaction.
      const hit = rows.find((r) => r.status === "found" && r.transaction?.transaction_id === id);
      if (hit?.transaction && latestId.current === id) {
        setDetail({ id, tx: hit.transaction, log: hit.telco_log ?? null });
        if (notify) onUpdatedRef.current(hit.transaction);
      }
    } catch {
      // keep showing the row data
    } finally {
      if (latestId.current === id) setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    setReceiptOpen(false);
    if (open && currentId) loadDetail(currentId);
  }, [open, currentId, loadDetail]);

  if (!transaction) return null;

  const fresh = detail && detail.id === transaction.transaction_id ? detail : null;
  const tx: TransactionItem = fresh ? { ...transaction, ...fresh.tx } : transaction;
  const log = fresh?.log ?? null;
  const tone = statusTone(tx);
  const provider = networkLabel(tx.network);
  const timeline = buildTimeline(tx, log);
  const commission = tx.commission_amount ?? 0;
  const networkRef = tx.response_transaction_id || log?.response_transaction_id || "";
  const isSuccessful = tx.status === "Successful" && !tx.refunded_at;
  const title = serviceTitle(tx);

  const refs: { label: string; value: string }[] = [
    { label: "Transaction ID", value: tx.transaction_id },
    { label: "Your reference", value: tx.external_ref ?? "" },
    { label: "Network reference", value: networkRef },
  ];
  const copyAll = refs
    .filter((r) => r.value)
    .map((r) => `${r.label}: ${r.value}`)
    .join("\n");

  const checkStatus = async () => {
    setChecking(true);
    try {
      const res = await new AxiosHandler(messageApi).post({
        endPoint: `${apiEndpoints.selfServiceQueryAndUpdateStatus}?transaction_refs=${encodeURIComponent(
          tx.transaction_id
        )}`,
        body: {},
      });
      const result: RequeryResult | undefined = Array.isArray(res?.data) ? res.data[0] : undefined;
      if (!result) {
        messageApi.info("No update from the network yet.");
      } else if (result.status === "updated") {
        messageApi.success(
          `Status updated: ${describeStatus(result.old_status).label} → ${describeStatus(result.new_status).label}`
        );
      } else if (result.status === "unchanged") {
        messageApi.info(`${provider || "The network"} hasn't confirmed this yet. We'll keep checking.`);
      } else if (result.status === "skipped") {
        messageApi.info("This transaction already has a final status.");
      } else {
        messageApi.error(result.message || "Couldn't check this transaction.");
      }
      await loadDetail(tx.transaction_id, true);
    } catch {
      // AxiosHandler already showed the error
    } finally {
      setChecking(false);
    }
  };

  const afterOpenChange = (visible: boolean) => {
    if (visible) {
      headingRef.current?.focus();
    } else if (returnFocusTo && document.contains(returnFocusTo)) {
      returnFocusTo.focus();
    }
  };

  return (
    <>
      {contextHolder}
      <Drawer
        open={open}
        onClose={onClose}
        placement="right"
        size={isMobile ? "100%" : 400}
        title={null}
        closable={false}
        aria-labelledby="tx-drawer-title"
        afterOpenChange={afterOpenChange}
        focusable={{ trap: true, focusTriggerAfterClose: false }}
        styles={{ body: { padding: 0 } }}
      >
        <div className="flex flex-col gap-[20px] p-[20px] font-body text-hisa-ink sm:p-[24px]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-[6px]">
              <h2
                id="tx-drawer-title"
                ref={headingRef}
                tabIndex={-1}
                className="m-0 break-words font-heading text-[18px] font-bold leading-snug text-hisa-ink focus:outline-none"
              >
                {title}
              </h2>
              <StatusPill status={tx.status} refunded={tx.refunded_at} className="self-start" />
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close details"
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border-[1px] border-solid border-hisa-border bg-white text-hisa-body hover:bg-[#F9FAFB] ${focusRing}`}
            >
              <CloseOutlined aria-hidden="true" />
            </button>
          </div>

          <div className="flex flex-col gap-[2px]">
            <span className="font-heading text-[30px] font-extrabold leading-tight">{formatNaira(tx.amount)}</span>
            <span className="text-sm text-hisa-muted">
              {tx.msisdn && (
                <>
                  to <span className="font-mono text-[13px] text-hisa-body">{tx.msisdn}</span>
                </>
              )}
              {commission > 0 && (
                <>
                  {tx.msisdn ? " · " : ""}debited {formatNaira(tx.amount - commission)} after commission
                </>
              )}
            </span>
            <span className="text-xs text-hisa-muted">{formatLagosDateTime(tx.created_at, "DD MMM YYYY, HH:mm:ss")} WAT</span>
          </div>

          {tone === "pending" && (
            <div
              role="note"
              className="rounded-[12px] border-[1px] border-solid border-[#FEDF89] bg-[#FFFAEB] px-[14px] py-[12px] text-sm leading-relaxed text-[#7A2E0E]"
            >
              {provider || "The network"} hasn&apos;t confirmed this yet. We&apos;ll keep checking and only refund if it
              definitely failed. No action needed.
            </div>
          )}
          {tone === "refunded" && (
            <div
              role="note"
              className="rounded-[12px] border-[1px] border-solid border-hisa-border bg-[#F9FAFB] px-[14px] py-[12px] text-sm leading-relaxed text-hisa-body"
            >
              This transaction didn&apos;t go through, so the money was returned to your wallet.
            </div>
          )}

          {(tx.token || tx.unit) && (
            <section aria-labelledby="tx-token-h" className="flex flex-col gap-2">
              <h3 id="tx-token-h" className={sectionHeading}>
                {tx.type === "Electricity" ? "Token" : "PIN / token"}
              </h3>
              {tx.token && (
                <div className="flex items-center justify-between gap-2 rounded-[10px] bg-[#F9FAFB] px-[12px] py-[10px]">
                  <span className="break-all font-mono text-[15px] font-semibold tracking-[0.04em]">{tx.token}</span>
                  <CopyButton value={tx.token} label="token" />
                </div>
              )}
              <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                {tx.unit && (
                  <>
                    <dt className="text-hisa-muted">Units</dt>
                    <dd className="m-0">{tx.unit}</dd>
                  </>
                )}
                {tx.beneficiary_name && (
                  <>
                    <dt className="text-hisa-muted">Name</dt>
                    <dd className="m-0">{tx.beneficiary_name}</dd>
                  </>
                )}
                {tx.beneficiary_details && (
                  <>
                    <dt className="text-hisa-muted">Address</dt>
                    <dd className="m-0">{tx.beneficiary_details}</dd>
                  </>
                )}
              </dl>
            </section>
          )}

          <section aria-labelledby="tx-timeline-h" className="flex flex-col gap-[10px]">
            <h3 id="tx-timeline-h" className={sectionHeading}>
              Timeline
            </h3>
            {timeline.length === 0 && detailLoading ? (
              <Skeleton active title={false} paragraph={{ rows: 3 }} />
            ) : (
              <ol className="m-0 flex list-none flex-col gap-3 p-0 text-sm">
                {timeline.map((s) => (
                  <li key={s.key} className="flex gap-3">
                    <span aria-hidden="true" className={`mt-[5px] h-[10px] w-[10px] flex-none rounded-full ${DOT[s.tone]}`} />
                    <div className="flex min-w-0 flex-col">
                      <span className="font-semibold">{s.label}</span>
                      <span className="text-hisa-muted">
                        {formatLagosDateTime(s.at, "D MMM, HH:mm:ss")}
                        {s.detail ? ` · ${s.detail}` : ""}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section aria-labelledby="tx-refs-h" className="flex flex-col gap-[10px]">
            <h3 id="tx-refs-h" className={sectionHeading}>
              References
            </h3>
            <dl className="m-0 flex flex-col gap-[10px] text-sm">
              {refs.map((r) => (
                <div key={r.label} className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-col">
                    <dt className="text-hisa-muted">{r.label}</dt>
                    <dd className={`m-0 break-all ${r.value ? "font-mono text-[13px]" : "text-hisa-muted"}`}>
                      {r.value || (r.label === "Network reference" ? "Not issued yet" : "None")}
                    </dd>
                  </div>
                  {r.value && <CopyButton value={r.value} label={r.label} />}
                </div>
              ))}
            </dl>
            {copyAll && (
              <CopyButton value={copyAll} label="all references" className="self-start">
                Copy all references
              </CopyButton>
            )}
          </section>

          {isSandboxResolvable(tx.status, tx.refunded_at) && (
            <section aria-label="Sandbox" className="flex flex-col gap-2">
              <h3 className={sectionHeading}>Sandbox</h3>
              <SandboxResolveActions
                reference={tx.transaction_id}
                status={tx.status}
                refundedAt={tx.refunded_at}
                onResolved={() => loadDetail(tx.transaction_id, true)}
              />
            </section>
          )}

          <div className="flex flex-wrap gap-[10px]">
            {isRequeryable(tx) && (
              <button type="button" className={btnPrimary} onClick={checkStatus} disabled={checking} aria-busy={checking}>
                {checking ? "Checking…" : "Check status now"}
              </button>
            )}
            <button
              type="button"
              className={`${btnSecondary} h-10`}
              onClick={() => router.push(`${routes.tickets}?ref=${encodeURIComponent(tx.transaction_id)}`)}
            >
              Raise a ticket
            </button>
            {isSuccessful && (
              <button type="button" className={`${btnSecondary} h-10`} onClick={() => setReceiptOpen(true)}>
                Receipt
              </button>
            )}
          </div>

          <Link href={routes.query(encodeURIComponent(tx.transaction_id))} className={`self-start text-sm ${textLink}`}>
            Open full details
          </Link>
        </div>
      </Drawer>
      {isSuccessful && <ReceiptModal item={tx} open={receiptOpen} onClose={() => setReceiptOpen(false)} />}
    </>
  );
};

const sectionHeading = "m-0 text-[13px] font-semibold uppercase tracking-[0.06em] text-hisa-muted";

export default TransactionDrawer;
