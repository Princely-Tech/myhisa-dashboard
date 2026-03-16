"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Upload, message, Button, Alert } from "antd";
import { InboxOutlined, DownloadOutlined } from "@ant-design/icons";
import { InputField, BlueButton } from "@/components";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import routes from "@/utils/routes";
import { BulkUploadResponse } from "@/utils/types";
import type { UploadProps } from "antd";

const { Dragger } = Upload;

const BulkAirtimeUpload = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [file, setFile] = useState<File | null>(null);
  const [messageTemplate, setMessageTemplate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null);
  const router = useRouter();

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
    <div className="flex-1 border px-4 pt-2 pb-5 flex flex-col min-h-screen overflow-hidden">
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

          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">
              Message Template (Optional)
            </h3>
            <InputField
              type="textArea"
              placeholder="Hello {{name}}, you have received NGN {{amount}} airtime on {{phone}}. Thank you!"
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              formItemProps={{}}
              showTitle={false}
            />
            <p className="text-sm text-gray-500 mt-2">
              Available placeholders: {"{"}
              {"{"}name{"}"}{"}"}
              , {"{"}{"{"}phone{"}"}{"}"}
              , {"{"}{"{"}amount{"}"}{"}"}
              , {"{"}{"{"}sn{"}"}
              {"}"}
            </p>
          </div>

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
