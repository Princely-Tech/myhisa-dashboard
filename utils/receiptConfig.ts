import { TransactionItem } from "@/utils/types";
import { formatDateSideBySide, koboToNaira } from "@/utils/helperfunctions";

export type ReceiptRow = {
  label: string;
  value: string;
  // rows marked "highlight" are rendered more prominently (e.g. token)
  highlight?: boolean;
};

export type ReceiptData = {
  // What this receipt is for, e.g. "Electricity Purchase Receipt"
  title: string;
  rows: ReceiptRow[];
};

const clean = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return "";
  const str = `${value}`.trim();
  return str;
};

const amountRow = (item: TransactionItem): ReceiptRow => ({
  label: "Amount",
  value: `₦${koboToNaira(item.amount)}`,
  highlight: true,
});

const commonTrailingRows = (item: TransactionItem): ReceiptRow[] => {
  const rows: ReceiptRow[] = [
    { label: "Reference", value: clean(item.transaction_id) },
  ];
  if (clean(item.external_ref)) {
    rows.push({ label: "External Reference", value: clean(item.external_ref) });
  }
  rows.push(
    { label: "Date & Time", value: formatDateSideBySide(item.created_at) },
    { label: "Status", value: clean(item.status) }
  );
  return rows;
};

/**
 * Builds the item titles/values for a transaction receipt, named according
 * to the type of transaction (e.g. "Meter Number" for electricity, "Phone
 * Number" for airtime/data) so the receipt reads naturally for whoever
 * receives it - including third parties like banks that ask for proof of
 * an electricity purchase.
 */
export function buildReceiptData(item: TransactionItem): ReceiptData {
  const type = (item.type || "").toLowerCase();

  if (type === "electricity") {
    const rows: ReceiptRow[] = [];
    if (clean(item.beneficiary_name)) {
      rows.push({ label: "Customer Name", value: clean(item.beneficiary_name) });
    }
    if (clean(item.beneficiary_details)) {
      rows.push({ label: "Address", value: clean(item.beneficiary_details) });
    }
    rows.push({ label: "Meter Number", value: clean(item.msisdn) });
    if (clean(item.data_bundle_desc)) {
      rows.push({ label: "Meter Type", value: clean(item.data_bundle_desc) });
    }
    rows.push({ label: "Disco", value: clean(item.network) });
    rows.push(amountRow(item));
    if (clean(item.unit)) {
      rows.push({ label: "Unit", value: clean(item.unit) });
    }
    if (clean(item.token)) {
      rows.push({ label: "Token", value: clean(item.token), highlight: true });
    }
    rows.push(...commonTrailingRows(item));
    return { title: "Electricity Purchase Receipt", rows };
  }

  if (type === "airtime") {
    const rows: ReceiptRow[] = [
      { label: "Phone Number", value: clean(item.msisdn) },
      { label: "Network", value: clean(item.network) },
      amountRow(item),
      ...commonTrailingRows(item),
    ];
    return { title: "Airtime Purchase Receipt", rows };
  }

  if (type === "data" || type === "gift-data") {
    const rows: ReceiptRow[] = [
      { label: "Phone Number", value: clean(item.msisdn) },
      { label: "Network", value: clean(item.network) },
    ];
    if (clean(item.data_bundle_desc)) {
      rows.push({ label: "Data Plan", value: clean(item.data_bundle_desc) });
    }
    rows.push(amountRow(item));
    rows.push(...commonTrailingRows(item));
    return { title: "Data Purchase Receipt", rows };
  }

  if (type === "cable") {
    const rows: ReceiptRow[] = [];
    if (clean(item.beneficiary_name)) {
      rows.push({ label: "Customer Name", value: clean(item.beneficiary_name) });
    }
    rows.push({ label: "Smart Card / IUC Number", value: clean(item.msisdn) });
    rows.push({ label: "Provider", value: clean(item.network) });
    if (clean(item.data_bundle_desc)) {
      rows.push({ label: "Package", value: clean(item.data_bundle_desc) });
    }
    rows.push(amountRow(item));
    rows.push(...commonTrailingRows(item));
    return { title: "Cable TV Subscription Receipt", rows };
  }

  if (type === "betting") {
    const rows: ReceiptRow[] = [];
    if (clean(item.beneficiary_name)) {
      rows.push({ label: "Customer Name", value: clean(item.beneficiary_name) });
    }
    rows.push({ label: "Customer ID", value: clean(item.msisdn) });
    rows.push({ label: "Provider", value: clean(item.network) });
    rows.push(amountRow(item));
    rows.push(...commonTrailingRows(item));
    return { title: "Betting Wallet Funding Receipt", rows };
  }

  if (type === "waec") {
    const rows: ReceiptRow[] = [
      { label: "Provider", value: clean(item.network) || "WAEC" },
      amountRow(item),
    ];
    if (clean(item.token)) {
      rows.push({ label: "PIN", value: clean(item.token), highlight: true });
    }
    rows.push(...commonTrailingRows(item));
    return { title: "WAEC PIN Purchase Receipt", rows };
  }

  // Generic fallback for any other service type
  const rows: ReceiptRow[] = [];
  if (clean(item.beneficiary_name)) {
    rows.push({ label: "Beneficiary", value: clean(item.beneficiary_name) });
  }
  rows.push({ label: "Beneficiary Number", value: clean(item.msisdn) });
  rows.push({ label: "Network / Biller", value: clean(item.network) });
  rows.push(amountRow(item));
  rows.push(...commonTrailingRows(item));
  return { title: "Transaction Receipt", rows };
}
