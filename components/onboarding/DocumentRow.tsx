"use client";
// One KYC document: uploads immediately on pick (POST
// /me/onboarding/documents/:type, multipart "file"), shows progress, status
// (uploaded / accepted / flagged + reviewer note), Replace and Remove.
import React, { useRef, useState } from "react";
import { Popconfirm, Progress, Upload } from "antd";
import type { UploadProps } from "antd";
import { ApiError, isApiError, onboardingApi } from "@/utils/api/onboardingApi";
import { DOCUMENT_LABELS, DOC_ACCEPT, documentFileProblem } from "@/utils/onboarding";
import { formatLagosDateTime } from "@/utils/format";
import type { OnboardingDocument, OnboardingView } from "@/utils/types";
import { btnSecondary } from "@/components/ui/styles";
import { btnOutlinePrimary } from "./ui";

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  uploaded: { label: "Uploaded", cls: "bg-[#EAF0FF] text-[#0B2FA8]" },
  accepted: { label: "Accepted", cls: "bg-[#DCFAE6] text-[#067647]" },
  flagged: { label: "Needs attention", cls: "bg-[#FEF0C7] text-[#93370D]" },
};

interface DocumentRowProps {
  doc: OnboardingDocument;
  editable: boolean;
  /** Highlight (e.g. named in the open query or missing at submit). */
  highlight?: boolean;
  onChanged: (view: OnboardingView) => Promise<void> | void;
}

const DocumentRow = ({ doc, editable, highlight, onChanged }: DocumentRowProps) => {
  const meta = DOCUMENT_LABELS[doc.type];
  const [progress, setProgress] = useState<number | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const statusId = `doc-${doc.type}-status`;
  const uploading = progress !== null;
  const present = doc.status !== "missing";

  const describeError = (err: unknown): string => {
    if (isApiError(err)) {
      const e = err as ApiError;
      if (e.lockedDocuments.length) return "This document can't be changed while your application is being reviewed.";
      return e.field("file") ?? e.message;
    }
    return "Upload failed. Check your connection and try again.";
  };

  const uploadProps: UploadProps = {
    accept: DOC_ACCEPT,
    multiple: false,
    showUploadList: false,
    disabled: !editable || uploading,
    beforeUpload: (file) => {
      const problem = documentFileProblem(file);
      if (problem) {
        setError(problem);
        return Upload.LIST_IGNORE;
      }
      setError(null);
      return true;
    },
    customRequest: async (options) => {
      const file = options.file as File;
      const controller = new AbortController();
      abortRef.current = controller;
      setFileName(file.name);
      setProgress(0);
      try {
        const res = await onboardingApi.uploadDocument(
          doc.type,
          file,
          (pct) => {
            setProgress(pct);
            options.onProgress?.({ percent: pct });
          },
          controller.signal
        );
        options.onSuccess?.(res);
        await onChanged(res.data);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(describeError(err));
          setFileName(null);
        }
        options.onError?.(err as Error);
      } finally {
        abortRef.current = null;
        setProgress(null);
      }
    },
  };

  const cancel = () => {
    abortRef.current?.abort();
    setProgress(null);
    setFileName(null);
  };

  const remove = async () => {
    setRemoving(true);
    setError(null);
    try {
      const res = await onboardingApi.deleteDocument(doc.type);
      setFileName(null);
      await onChanged(res.data);
    } catch (err) {
      setError(describeError(err));
    }
    setRemoving(false);
  };

  const pill = STATUS_PILL[doc.status];
  const borderCls = !present && !uploading
    ? "border-[1.5px] border-dashed border-[#B2BDD9] bg-[#FAFBFF]"
    : doc.status === "flagged" || highlight
    ? "border-[1px] border-solid border-[#FEC84B] bg-[#FFFCF5]"
    : "border-[1px] border-solid border-hisa-border bg-white";

  return (
    <li className={`flex flex-wrap items-center justify-between gap-3 rounded-[12px] px-[16px] py-[12px] ${borderCls}`}>
      <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-[2px]">
        <span className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-hisa-ink">
          {meta.label}
          {doc.required ? (
            <span className="text-[12px] font-normal text-hisa-muted">Required</span>
          ) : (
            <span className="text-[12px] font-normal text-hisa-muted">Optional</span>
          )}
        </span>
        <span id={statusId} aria-live="polite" className="flex flex-col gap-[6px] text-[13px] text-hisa-muted">
          {uploading ? (
            <span className="flex items-center gap-[10px]">
              <Progress
                percent={progress ?? 0}
                size="small"
                showInfo={false}
                className="m-0 flex-1"
                aria-label={`Uploading ${meta.label}`}
              />
              <span>Uploading {progress}%</span>
            </span>
          ) : present ? (
            <span>
              {fileName ? `${fileName} · ` : ""}
              {doc.uploaded_at ? `Uploaded ${formatLagosDateTime(doc.uploaded_at)}` : "Uploaded"}
            </span>
          ) : (
            <span>{meta.hint} · PDF, JPG or PNG up to 5 MB</span>
          )}
          {doc.status === "flagged" && doc.reviewer_note && (
            <span className="text-[#93370D]">
              <strong>Reviewer note:</strong> {doc.reviewer_note}
            </span>
          )}
          {error && (
            <span role="alert" className="text-[#B42318]">
              {error}
            </span>
          )}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {pill && !uploading && (
          <span className={`whitespace-nowrap rounded-full px-[10px] py-1 text-[13px] font-semibold ${pill.cls}`}>{pill.label}</span>
        )}
        {uploading ? (
          <button type="button" className={btnSecondary} onClick={cancel}>
            Cancel
          </button>
        ) : editable ? (
          <>
            <Upload {...uploadProps}>
              <button
                type="button"
                className={present ? btnSecondary : btnOutlinePrimary}
                aria-describedby={statusId}
                aria-label={`${present ? "Replace" : "Upload"} ${meta.label}`}
              >
                {present ? "Replace" : "Upload file"}
              </button>
            </Upload>
            {present && (
              <Popconfirm
                title={`Remove ${meta.label.toLowerCase()}?`}
                okText="Remove"
                okButtonProps={{ danger: true }}
                onConfirm={remove}
              >
                <button type="button" className={btnSecondary} disabled={removing} aria-label={`Remove ${meta.label}`}>
                  {removing ? "Removing…" : "Remove"}
                </button>
              </Popconfirm>
            )}
          </>
        ) : null}
      </div>
    </li>
  );
};

export default DocumentRow;
