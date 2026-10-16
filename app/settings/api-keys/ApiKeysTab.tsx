"use client";
import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Alert, Input, Modal, message } from "antd";
import { CopyOutlined, EyeInvisibleOutlined, EyeOutlined, SyncOutlined } from "@ant-design/icons";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import type { ApiKeyResponse } from "@/utils/types";
import { isSandbox } from "@/utils/environment";
import Card from "@/components/ui/Card";
import StatusPill from "@/components/ui/StatusPill";
import { btnDanger, btnPrimary, btnSecondary } from "@/components/ui/styles";
import { goLiveStorageKeys } from "@/app/dashboard/GoLiveChecklist";
import { forceReLogin } from "@/utils/session";
import { apiErrorMessage, copyText, writeFlag } from "./shared";
import QuickStart from "./QuickStart";

/** How long a revealed key stays on screen. */
const REVEAL_SECONDS = 60;
const MASK = "••••••••••••••••";

const keyField =
  "block min-w-0 flex-[1_1_280px] break-all rounded-[10px] border-[1px] border-solid border-hisa-border bg-[#F2F4F7] px-[14px] py-[10px] font-mono text-sm text-hisa-ink";

/**
 * POST me/api-key/reveal / me/refresh-api-key with axios directly instead of
 * AxiosHandler.post, which console.logs the request body (the password) and
 * the response (the key).
 * - reveal: errors are returned to the caller untouched and shown inline
 *   (including 401/429), see describeRevealError.
 * - rotate: errors also go through AxiosHandler.errHandler (forced re-login
 *   on 401), which rethrows - unchanged behaviour.
 */
async function postForKey(
  kind: "reveal" | "rotate",
  body: { password: string; email?: string }
): Promise<string> {
  const handler = new AxiosHandler(); // silent: callers show errors inline
  const endPoint = kind === "reveal" ? apiEndpoints.meRevealApiKey : apiEndpoints.meRefreshApiKey;
  try {
    const res = await axios.post<ApiKeyResponse>(`${apiEndpoints.base}${endPoint}`, body, {
      headers: handler.getHeader(),
    });
    const key = res.data?.data?.api_key;
    if (!key) throw new Error("No API key in the response");
    return key;
  } catch (err) {
    if (kind === "rotate" && axios.isAxiosError(err)) handler.errHandler(err);
    throw err;
  }
}

interface RevealError {
  text: string;
  sessionExpired?: boolean;
}

function describeRevealError(err: unknown): RevealError {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    if (status === 401) {
      return { text: "Your session has expired. Sign in again to reveal your key.", sessionExpired: true };
    }
    if (status === 429) {
      const data = err.response?.data as { retry_after_seconds?: number } | undefined;
      const header = Number(err.response?.headers?.["retry-after"]);
      const secs = data?.retry_after_seconds ?? (isFinite(header) && header > 0 ? header : undefined);
      return {
        text: `Too many attempts. Try again in ${secs ? `${Math.ceil(secs)} seconds` : "a minute"}.`,
      };
    }
    if (status === 400) return { text: "That password isn't right. Try again." };
    if (status === 422) return { text: "Enter your password." };
    if (status === 403) return { text: "Only the main account login can view the API key." };
    if (!err.response) return { text: "Couldn't reach the server. Check your connection and try again." };
  }
  return { text: apiErrorMessage(err, undefined, "Couldn't reveal the key. Try again.") };
}

interface ApiKeysTabProps {
  userId?: number;
  /** Primary login email; me/refresh-api-key requires it with the password. */
  email?: string;
  /** False when another Developers tab is selected (hides a revealed key). */
  active: boolean;
}

const ApiKeysTab = ({ userId, email, active }: ApiKeysTabProps) => {
  const [messageApi, contextHolder] = message.useMessage();

  // Nothing about the key is fetched on load (/me doesn't expose it). The
  // last 4 characters are remembered, in memory only, from a reveal/rotate
  // response; the full key is held only while revealed (or in the one-time
  // new-key modal).
  const [last4, setLast4] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const [revealOpen, setRevealOpen] = useState(false);
  const [revealPassword, setRevealPassword] = useState("");
  const [revealing, setRevealing] = useState(false);
  const [revealError, setRevealError] = useState<RevealError | null>(null);

  const [rotateOpen, setRotateOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [rotating, setRotating] = useState(false);
  const [rotateError, setRotateError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);

  const keyLabel = isSandbox ? "Test API key" : "Live API key";

  const markViewed = useCallback(() => {
    if (userId !== undefined) writeFlag(goLiveStorageKeys.apiKeyViewed(userId));
  }, [userId]);

  const hide = useCallback(() => {
    setRevealed(null);
    setSecondsLeft(0);
  }, []);

  // Auto-hide: countdown, switching Developers tab, or leaving the browser tab.
  useEffect(() => {
    if (!revealed) return;
    const id = window.setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [revealed]);

  useEffect(() => {
    if (revealed && secondsLeft <= 0) setRevealed(null);
  }, [revealed, secondsLeft]);

  useEffect(() => {
    if (!active) hide();
  }, [active, hide]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") hide();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [hide]);

  const closeReveal = () => {
    if (revealing) return;
    setRevealOpen(false);
    setRevealPassword("");
    setRevealError(null);
  };

  // Password-confirmed: POST me/api-key/reveal (5 attempts/min per account).
  const doReveal = async () => {
    if (!revealPassword || revealing) return;
    setRevealing(true);
    setRevealError(null);
    try {
      const key = await postForKey("reveal", { password: revealPassword });
      setRevealOpen(false);
      setRevealPassword("");
      setRevealed(key);
      setLast4(key.slice(-4));
      setSecondsLeft(REVEAL_SECONDS);
      markViewed();
    } catch (err) {
      setRevealError(describeRevealError(err));
    } finally {
      setRevealing(false);
    }
  };

  const onCopy = async (value: string | null, what = "API key") => {
    if (!value) return;
    const ok = await copyText(value);
    if (ok) messageApi.success(`${what} copied`);
    else messageApi.error("Couldn't copy. Select the text and copy it manually.");
  };

  const closeRotate = () => {
    if (rotating) return;
    setRotateOpen(false);
    setConfirmText("");
    setPassword("");
    setRotateError(null);
  };

  const doRotate = async () => {
    if (!email) {
      setRotateError("Your session is missing an email address. Sign out and back in, then try again.");
      return;
    }
    setRotating(true);
    setRotateError(null);
    try {
      // Silent handler: the error is shown inline in the modal.
      const key = await postForKey("rotate", { email, password });
      hide();
      setRotateOpen(false);
      setConfirmText("");
      setPassword("");
      setNewKey(key);
      setLast4(key.slice(-4));
      markViewed();
      // The backend evicts the old key from its cache on the server that
      // handled this request; other API servers drop their cached copy
      // within the 60 s cache TTL.
      messageApi.info(
        "New key issued. The old key is rejected right away (on every server within about a minute, once caches refresh).",
        8
      );
    } catch (err) {
      setRotateError(apiErrorMessage(err, undefined, "Couldn't rotate the key. Try again."));
    } finally {
      setRotating(false);
    }
  };

  const display = revealed ?? `${MASK}${last4 ?? "••••"}`;

  return (
    <div className="flex flex-col gap-[18px]">
      {contextHolder}
      <Card
        title={
          <span className="flex flex-wrap items-center gap-[10px]">
            {keyLabel}
            {last4 && <StatusPill tone="success" label="Active" />}
          </span>
        }
      >
        <div className="flex flex-wrap items-center gap-[10px]">
          <code className={keyField} aria-label={revealed ? `${keyLabel} (revealed)` : `${keyLabel} (hidden)`}>
            {display}
          </code>
          {revealed ? (
            <button type="button" className={btnSecondary} onClick={hide}>
              <EyeInvisibleOutlined aria-hidden="true" /> Hide
            </button>
          ) : (
            <button
              type="button"
              className={btnSecondary}
              onClick={() => setRevealOpen(true)}
            >
              <EyeOutlined aria-hidden="true" /> Reveal
            </button>
          )}
          <button
            type="button"
            className={btnSecondary}
            onClick={() => onCopy(revealed)}
            disabled={!revealed}
            title={revealed ? undefined : "Reveal the key to copy it"}
          >
            <CopyOutlined aria-hidden="true" /> Copy
          </button>
          <button type="button" className={btnDanger} onClick={() => setRotateOpen(true)}>
            <SyncOutlined aria-hidden="true" /> Rotate key
          </button>
        </div>
        <p className="m-0 text-[13px] text-hisa-muted" aria-live="polite">
          {revealed
            ? `Key visible. It hides automatically in ${secondsLeft}s.`
            : !last4
            ? "Reveal to view. Send it as a Bearer token in the Authorization header."
            : "Send it as a Bearer token in the Authorization header. Rotating stops the old key immediately, so update your servers first."}
        </p>
      </Card>

      <QuickStart />

      {/* Reveal: password-confirmed. */}
      <Modal
        open={revealOpen}
        title={`Reveal your ${keyLabel.toLowerCase()}`}
        okText="Reveal key"
        okButtonProps={{ disabled: !revealPassword, loading: revealing }}
        cancelButtonProps={{ disabled: revealing }}
        onOk={doReveal}
        onCancel={closeReveal}
        destroyOnHidden
      >
        <form
          className="flex flex-col gap-[14px]"
          onSubmit={(e) => {
            e.preventDefault();
            doReveal();
          }}
        >
          <p className="m-0 text-sm text-hisa-body">
            Confirm your password to see the full key. It stays on screen for {REVEAL_SECONDS} seconds, then hides
            again. Make sure no one can see your screen, and store the key only in your server&apos;s secrets.
          </p>
          <label className="flex flex-col gap-1 text-[13px] font-semibold text-hisa-body">
            Your password
            <Input.Password
              value={revealPassword}
              onChange={(e) => {
                setRevealPassword(e.target.value);
                if (revealError && !revealError.sessionExpired) setRevealError(null);
              }}
              autoComplete="current-password"
              autoFocus
              status={revealError && !revealError.sessionExpired ? "error" : undefined}
            />
          </label>
          {revealError && (
            <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-[#B42318]">
              <span>{revealError.text}</span>
              {revealError.sessionExpired && (
                <button type="button" className={btnSecondary} onClick={() => forceReLogin()}>
                  Sign in again
                </button>
              )}
            </div>
          )}
          {/* Lets Enter submit the form. */}
          <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true" />
        </form>
      </Modal>

      {/* Rotate: type ROTATE + password (me/refresh-api-key requires it). */}
      <Modal
        open={rotateOpen}
        title={`Rotate your ${keyLabel.toLowerCase()}?`}
        okText={rotating ? "Rotating…" : "Rotate key"}
        okButtonProps={{
          danger: true,
          disabled: confirmText !== "ROTATE" || !password,
          loading: rotating,
        }}
        cancelButtonProps={{ disabled: rotating }}
        onOk={doRotate}
        onCancel={closeRotate}
        destroyOnHidden
      >
        <form
          className="flex flex-col gap-[14px]"
          onSubmit={(e) => {
            e.preventDefault();
            if (confirmText === "ROTATE" && password && !rotating) doRotate();
          }}
        >
          <Alert
            type="warning"
            showIcon
            title="Your current key stops working immediately."
            description="Any server still using it gets 401 errors until you deploy the new key."
          />
          <label className="flex flex-col gap-1 text-[13px] font-semibold text-hisa-body">
            <span>
              Type <span className="font-mono">ROTATE</span> to confirm
            </span>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              placeholder="ROTATE"
            />
          </label>
          <label className="flex flex-col gap-1 text-[13px] font-semibold text-hisa-body">
            Your password
            <Input.Password
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          {rotateError && (
            <p role="alert" className="m-0 text-sm text-[#B42318]">
              {rotateError}
            </p>
          )}
          {/* Lets Enter submit the form. */}
          <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true" />
        </form>
      </Modal>

      {/* One-time display of the new key. */}
      <Modal
        open={!!newKey}
        title="Your new API key"
        closable={false}
        mask={{ closable: false }}
        keyboard={false}
        footer={
          <button type="button" className={btnPrimary} onClick={() => setNewKey(null)}>
            I&apos;ve saved it
          </button>
        }
        destroyOnHidden
      >
        <div className="flex flex-col gap-[12px]">
          <p className="m-0 text-sm text-hisa-body">
            Copy it now and add it to your servers. The old key no longer works.
          </p>
          <div className="flex flex-wrap items-center gap-[10px]">
            <code className={keyField}>{newKey}</code>
            <button type="button" className={btnSecondary} onClick={() => onCopy(newKey, "New API key")}>
              <CopyOutlined aria-hidden="true" /> Copy
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ApiKeysTab;
