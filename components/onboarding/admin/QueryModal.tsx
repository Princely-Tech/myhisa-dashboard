"use client";
// Query modal: templated reasons + free note + the fields/documents to
// unlock for the partner (POST /admin/onboarding/:id/query).
import React, { useEffect, useState } from "react";
import { Modal } from "antd";
import { DOCUMENT_LABELS, DOCUMENT_TYPES, QUERYABLE_FIELDS } from "@/utils/onboarding";
import type { KycDocumentType } from "@/utils/types";
import { focusRing } from "@/components/ui/styles";

interface Template {
  label: string;
  note: string;
  fields?: string[];
  documents?: KycDocumentType[];
}

const TEMPLATES: Template[] = [
  {
    label: "Proof of address too old",
    note: "Your proof of address is older than 3 months. Please upload a utility bill or bank statement dated within the last 3 months.",
    documents: ["proof_of_address"],
  },
  {
    label: "CAC certificate unclear",
    note: "We couldn't read your CAC certificate clearly. Please upload a clear, complete scan of the certificate.",
    documents: ["cac_certificate"],
  },
  {
    label: "CAC number not verified",
    note: "We couldn't verify your CAC registration number. Please check the number and business type and verify it again.",
    fields: ["business_type", "rc_number"],
  },
  {
    label: "Signatory doesn't match BVN",
    note: "The signatory's name doesn't match the name on the BVN record. Please correct the name or provide the BVN of the signatory.",
    fields: ["signatory_name", "bvn", "nin"],
  },
  {
    label: "Signatory not a director",
    note: "The signatory isn't listed as a director on your CAC record. Please name a director as the signatory, or upload a CAC status report showing them.",
    fields: ["signatory_name", "signatory_role", "bvn", "nin"],
    documents: ["cac_status_report"],
  },
  {
    label: "CBN licence needed",
    note: "Please upload a valid CBN operating licence for your institution.",
    documents: ["cbn_licence"],
  },
  {
    label: "Address incomplete",
    note: "Your business address is incomplete. Please provide the full street address, LGA and state.",
    fields: ["address"],
  },
];

interface QueryModalProps {
  open: boolean;
  busy: boolean;
  error?: string | null;
  onCancel: () => void;
  onSubmit: (body: { note: string; fields: string[]; documents: string[] }) => void;
}

export default function QueryModal({ open, busy, error, onCancel, onSubmit }: QueryModalProps) {
  const [note, setNote] = useState("");
  const [fields, setFields] = useState<string[]>([]);
  const [documents, setDocuments] = useState<string[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setNote("");
      setFields([]);
      setDocuments([]);
      setLocalError(null);
    }
  }, [open]);

  const applyTemplate = (t: Template) => {
    setNote((n) => (n.trim() ? `${n.trim()}\n\n${t.note}` : t.note));
    setFields((f) => Array.from(new Set([...f, ...(t.fields ?? [])])));
    setDocuments((d) => Array.from(new Set([...d, ...(t.documents ?? [])])));
  };

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const submit = () => {
    if (!note.trim()) {
      setLocalError("Write a note for the partner");
      document.getElementById("query-note")?.focus();
      return;
    }
    if (note.trim().length > 2000) {
      setLocalError("Keep the note under 2,000 characters");
      return;
    }
    setLocalError(null);
    onSubmit({ note: note.trim(), fields, documents });
  };

  const boxCls = `h-4 w-4 accent-hisa-primary`;

  return (
    <Modal
      open={open}
      title="Query the application"
      onCancel={onCancel}
      onOk={submit}
      okText="Send query"
      okButtonProps={{ loading: busy }}
      width={680}
      destroyOnHidden
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-hisa-body">Common reasons</span>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => applyTemplate(t)}
                className={`rounded-full border-[1px] border-solid border-[#D0D5DD] bg-white px-[12px] py-1 text-[13px] text-hisa-body hover:bg-[#F9FAFB] ${focusRing}`}
              >
                + {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-[6px]">
          <label htmlFor="query-note" className="m-0 text-[13px] font-semibold text-hisa-body">
            Note to the partner (emailed and shown on their application)
          </label>
          <textarea
            id="query-note"
            rows={4}
            maxLength={2000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            aria-invalid={!!localError || undefined}
            aria-describedby={localError ? "query-note-error" : undefined}
            className={`w-full rounded-[8px] border-[1px] border-solid border-[#D0D5DD] px-[10px] py-2 text-sm ${focusRing}`}
          />
          {localError && (
            <span id="query-note-error" className="text-[13px] text-[#B42318]">
              {localError}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <fieldset className="m-0 flex flex-col gap-[6px] border-0 p-0">
            <legend className="mb-1 p-0 text-[13px] font-semibold text-hisa-body">Fields to unlock</legend>
            {QUERYABLE_FIELDS.map((f) => (
              <label key={f.value} className="m-0 flex items-center gap-2 text-[13px] text-hisa-body">
                <input type="checkbox" className={boxCls} checked={fields.includes(f.value)} onChange={() => toggle(fields, setFields, f.value)} />
                {f.label}
              </label>
            ))}
          </fieldset>
          <fieldset className="m-0 flex flex-col gap-[6px] border-0 p-0">
            <legend className="mb-1 p-0 text-[13px] font-semibold text-hisa-body">Documents to replace</legend>
            {DOCUMENT_TYPES.map((d) => (
              <label key={d} className="m-0 flex items-center gap-2 text-[13px] text-hisa-body">
                <input type="checkbox" className={boxCls} checked={documents.includes(d)} onChange={() => toggle(documents, setDocuments, d)} />
                {DOCUMENT_LABELS[d].label}
              </label>
            ))}
            <p className="m-0 mt-2 text-[12px] text-hisa-muted">
              Only the ticked items become editable for the partner; named documents are marked flagged. Nothing ticked = nothing is
              editable, so the partner can only reply.
            </p>
          </fieldset>
        </div>

        {error && (
          <p role="alert" className="m-0 text-[13px] text-[#B42318]">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
