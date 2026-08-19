"use client";
import React, { useRef, useState } from "react";
import { Modal, message } from "antd";
import { TransactionItem } from "@/utils/types";
import { CustomButton } from "@/components/buttons";
import TransactionReceipt from "./TransactionReceipt";

const ReceiptModal = ({
  item,
  open,
  onClose,
}: {
  item: TransactionItem | null;
  open: boolean;
  onClose: () => void;
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handleDownload = async () => {
    if (!receiptRef.current || !item) return;
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      // the modal remounts on every open, so the logo <img> may still be
      // loading at this point - wait for it (and any other images) before
      // rasterizing, otherwise the download can capture a blank logo.
      const images = Array.from(receiptRef.current.querySelectorAll("img"));
      await Promise.all(
        images.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              })
        )
      );

      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const imageData = canvas.toDataURL("image/png");

      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [pdfWidth, pdfHeight],
      });
      pdf.addImage(imageData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`receipt_${item.transaction_id}.pdf`);
    } catch (err) {
      messageApi.error("Failed to generate receipt. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal
      title="Transaction Receipt"
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      destroyOnClose
    >
      {contextHolder}
      {item && (
        <div className="flex flex-col items-center gap-5">
          <div className="max-w-full overflow-auto">
            <TransactionReceipt ref={receiptRef} item={item} />
          </div>
          <CustomButton
            tokenConfig={{ colorPrimary: "#103FD5", borderRadius: 8, colorText: "white" }}
            type="primary"
            loading={downloading}
            onClick={handleDownload}
          >
            Download Receipt
          </CustomButton>
        </div>
      )}
    </Modal>
  );
};

export default ReceiptModal;
