"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Upload, message, Button, Alert, Select } from "antd";
import { InboxOutlined, DownloadOutlined } from "@ant-design/icons";
import { InputField, BlueButton } from "@/components";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import routes from "@/utils/routes";
import { BulkUploadResponse, SenderID, SenderIDListResponse } from "@/utils/types";
import type { UploadProps } from "antd";
import Link from "next/link";

const { Dragger } = Upload;

const BulkAirtimeUpload = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [file, setFile] = useState<File | null>(null);
  const [messageTemplate, setMessageTemplate] = useState("");
  const [selectedSenderId, setSelectedSenderId] = useState<string>("");
  const [senderIds, setSenderIds] = useState<SenderID[]>([]);
  const [loadingSenderIds, setLoadingSenderIds] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetchSenderIds();
  }, []);

  const fetchSenderIds = async () => {
    try {
      const apiService = new AxiosHandler(messageApi);
      const res: SenderIDListResponse = await apiService.get({
        endPoint: apiEndpoints.senderIds,
      });
      setSenderIds(res.sender_ids);
      const defaultSender = res.sender_ids.find((s) => s.is_default);
      if (defaultSender) {
        setSelectedSenderId(defaultSender.sender_id);
      }
    } catch (err) {
      console.error("Failed to load sender IDs");
    } finally {
      setLoadingSenderIds(false);
    }
  };

  const uploadProps: UploadProps = {
    name: "file",
    multiple: false,
    accept: ".csv",
    beforeUpload: (file) => {
      const isCSV = file.type === "text/csv" || file.name.endsWith(".csv");
      if (!isCSV) {
        messageApi.error("You can only upload CSV files!");
        return false;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        messageApi.error("File must be smaller than 10MB!");
        return false;
      }
      setFile(file);
      return false;
    },
    onRemove: () => {
      setFile(null);
    },
    fileList: file ? [file as any] : [],
  };

  const handleDownloadSample = () => {
    const link = document.createElement("a");
    link.href = "/samples/sample_bulk_airtime.csv";
    link.download = "sample_bulk_airtime.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async () => {
    if (!file) {
      messageApi.error("Please select a CSV file to upload");
      return;
    }

    setUploading(true);
    setDuplicateWarning(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (messageTemplate) {
        formData.append("message_template", messageTemplate);
      }
      if (selectedSenderId) {
        formData.append("sender_id", selectedSenderId);
      }

      const apiService = new AxiosHandler(messageApi);
      const response = await fetch(
        `${apiEndpoints.base}${apiEndpoints.bulkAirtimeUpload}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              apiEndpoints.tokenSetUrl
            )}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (response.ok) {
        if (result.warning && result.duplicate_info && !result.campaign_id) {
          setDuplicateWarning(result.duplicate_info);
          messageApi.warning(result.warning);
        } else if (result.campaign_id) {
          messageApi.success(result.message || "File uploaded successfully");
          router.push(routes.bulkAirtimeReview(result.campaign_id));
        }
      } else {
        messageApi.error(result.error || result.message || "Upload failed");
      }
    } catch (error: any) {
      messageApi.error(error?.response?.data?.error || error?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex-1 border px-4 pt-2 pb-5 flex flex-col min-h-screen overflow-auto">
      {contextHolder}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Bulk Airtime Upload
        </h1>
        <p className="text-gray-600 mt-2">
          Upload a CSV file to send airtime to multiple recipients with optional
          SMS notifications
        </p>
      </div>

      <div className="max-w-4xl">
        <Card className="mb-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Instructions</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Maximum file size: 10MB</li>
              <li>Maximum rows: 10,000 per upload</li>
              <li>Phone numbers must be unique within the upload</li>
              <li>Supported networks: MTN, Airtel, Glo, 9mobile</li>
              <li>Amount is in Naira (not kobo)</li>
              <li>
                Use placeholders in message template: {"{"}
                {"{"}name{"}"}{"}"}
                , {"{"}{"{"}phone{"}"}{"}"}
                , {"{"}{"{"}amount{"}"}{"}"}
                , {"{"}{"{"}sn{"}"}
                {"}"}
              </li>
            </ul>
          </div>

          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownloadSample}
            className="mb-4"
          >
            Download Sample CSV
          </Button>

          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Upload CSV File</h3>
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                Click or drag CSV file to this area to upload
              </p>
              <p className="ant-upload-hint">
                Support for a single CSV file upload. File must be less than
                10MB.
              </p>
            </Dragger>
          </div>

          <Card className="mb-6">
            <h3 className="text-lg font-semibold mb-4">
              SMS Settings (Optional)
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sender ID
              </label>
              <Select
                style={{ width: "100%" }}
                placeholder="Select sender ID"
                value={selectedSenderId || undefined}
                onChange={(value) => setSelectedSenderId(value)}
                loading={loadingSenderIds}
                allowClear
              >
                {senderIds.map((sender) => (
                  <Select.Option key={sender.id} value={sender.sender_id}>
                    {sender.sender_id} ({sender.type})
                    {sender.is_default && " - Default"}
                  </Select.Option>
                ))}
              </Select>
              <div className="mt-2">
                <Link
                  href={routes.senderIds}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Manage Sender IDs →
                </Link>
              </div>
            </div>

            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Template
              </label>
              <InputField
                type="textArea"
                placeholder="Enter your message template"
                value={messageTemplate}
                onChange={(e: any) => setMessageTemplate(e.target.value)}
                showTitle={false}
              />
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <p className="font-semibold mb-1">Available placeholders:</p>
              <ul className="list-disc list-inside">
                <li>
                  <code className="bg-gray-100 px-1 rounded">{"{{name}}"}</code> -
                  Recipient&apos;s name
                </li>
                <li>
                  <code className="bg-gray-100 px-1 rounded">{"{{phone}}"}</code>{" "}
                  - Phone number
                </li>
                <li>
                  <code className="bg-gray-100 px-1 rounded">
                    {"{{amount}}"}
                  </code>{" "}
                  - Airtime amount
                </li>
                <li>
                  <code className="bg-gray-100 px-1 rounded">{"{{sn}}"}</code> -
                  Serial number
                </li>
              </ul>
            </div>
          </Card>

          {duplicateWarning && (
            <Alert
              message="Duplicate Upload Detected"
              description={
                <div>
                  <p>
                    A similar file "{duplicateWarning.file_name}" was uploaded
                    on {new Date(duplicateWarning.uploaded_at).toLocaleString()}{" "}
                    with {duplicateWarning.total_rows} rows.
                  </p>
                  <p className="mt-2">
                    You can continue with this upload if you want to proceed
                    anyway.
                  </p>
                </div>
              }
              type="warning"
              showIcon
              className="mb-4"
            />
          )}

          <BlueButton
            onClick={handleUpload}
            loading={uploading}
            disabled={!file}
            className="w-full"
          >
            Upload and Continue
          </BlueButton>
        </Card>
      </div>
    </div>
  );
};

export default BulkAirtimeUpload;
