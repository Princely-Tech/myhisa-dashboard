"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, Table, message, Statistic, Row, Col, Modal, Input } from "antd";
import { BlueButton } from "@/components";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import routes from "@/utils/routes";
import { BulkCampaignStatusResponse } from "@/utils/types";
import { plainKoboNairaConvert } from "@/utils/helperfunctions";

const BulkAirtimeReview = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [data, setData] = useState<BulkCampaignStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otp, setOtp] = useState("");
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();
  const params = useParams();
  const campaignId = params.campaignId as string;

  useEffect(() => {
    fetchCampaignData();
  }, [campaignId]);

  const fetchCampaignData = async () => {
    try {
      const apiService = new AxiosHandler(messageApi);
      const res = await apiService.get({
        endPoint: apiEndpoints.bulkAirtimeCampaignById(campaignId),
      });
      setData(res);
    } catch (err) {
      messageApi.error("Failed to load campaign data");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    setRequestingOtp(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      await apiService.post({
        endPoint: apiEndpoints.bulkAirtimeRequestOtp(campaignId),
        body: {},
      });
      messageApi.success("OTP sent to your phone");
      setOtpModalVisible(true);
    } catch (err) {
      messageApi.error("Failed to request OTP");
    } finally {
      setRequestingOtp(false);
    }
  };

  const handleConfirm = async () => {
    if (!otp || otp.length !== 6) {
      messageApi.error("Please enter a valid 6-digit OTP");
      return;
    }

    setConfirming(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const res = await apiService.post({
        endPoint: apiEndpoints.bulkAirtimeConfirm(campaignId),
        body: { otp },
      });
      messageApi.success("Campaign started successfully!");
      router.push(routes.bulkAirtimeStatus(campaignId));
    } catch (err: any) {
      if (err?.response?.status === 402) {
        const errorData = err.response.data;
        messageApi.error(
          `Insufficient balance. Required: NGN ${plainKoboNairaConvert(
            errorData.required * 100
          )}, Current: NGN ${plainKoboNairaConvert(
            errorData.current_balance * 100
          )}`
        );
      } else {
        messageApi.error("Failed to confirm campaign");
      }
    } finally {
      setConfirming(false);
    }
  };

  const columns = [
    {
      title: "Row",
      dataIndex: "row_number",
      key: "row_number",
      width: 80,
    },
    {
      title: "SN",
      dataIndex: "sn",
      key: "sn",
      width: 80,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => `NGN ${plainKoboNairaConvert(amount)}`,
    },
    {
      title: "Network",
      dataIndex: "network",
      key: "network",
      render: (network: string) => network.toUpperCase(),
    },
    {
      title: "Message",
      dataIndex: "message",
      key: "message",
      ellipsis: true,
    },
  ];

  if (loading) {
    return (
      <div className="flex-1 border px-4 pt-2 pb-5 flex justify-center items-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 border px-4 pt-2 pb-5 flex justify-center items-center min-h-screen">
        <div>Campaign not found</div>
      </div>
    );
  }

  return (
    <div className="flex-1 border px-4 pt-2 pb-5 flex flex-col min-h-screen overflow-hidden">
      {contextHolder}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Review & Confirm Campaign
        </h1>
        <p className="text-gray-600 mt-2">
          Review the summary and preview before confirming the campaign
        </p>
      </div>

      <div className="max-w-6xl">
        <Card className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Campaign Summary</h3>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="Total Recipients"
                value={data.campaign.total_rows}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Total Airtime Amount"
                value={plainKoboNairaConvert(data.campaign.total_amount)}
                prefix="NGN"
                precision={2}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="SMS Cost"
                value={plainKoboNairaConvert(data.campaign.total_sms_cost)}
                prefix="NGN"
                precision={2}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Total Cost"
                value={plainKoboNairaConvert(data.campaign.total_amount + data.campaign.total_sms_cost)}
                prefix="NGN"
                precision={2}
              />
            </Col>
          </Row>
          {data.campaign.message_template && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Message Template:</h4>
              <p className="text-gray-600 bg-gray-50 p-3 rounded">
                {data.campaign.message_template}
              </p>
            </div>
          )}
        </Card>

        {data.items && data.items.length > 0 && (
          <Card className="mb-6">
            <h3 className="text-lg font-semibold mb-4">
              Preview (First {data.items.length} items)
            </h3>
            <Table
              columns={columns}
              dataSource={data.items}
              rowKey="id"
              pagination={false}
              scroll={{ x: 800 }}
            />
          </Card>
        )}

        <Card>
          <div className="flex gap-4">
            <BlueButton
              onClick={handleRequestOtp}
              loading={requestingOtp}
              className="flex-1"
            >
              Request OTP to Confirm
            </BlueButton>
          </div>
        </Card>
      </div>

      <Modal
        title="Enter OTP"
        open={otpModalVisible}
        onOk={handleConfirm}
        onCancel={() => {
          setOtpModalVisible(false);
          setOtp("");
        }}
        confirmLoading={confirming}
        okText="Confirm & Start Campaign"
      >
        <p className="mb-4">
          Please enter the 6-digit OTP sent to your phone number
        </p>
        <Input
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength={6}
          size="large"
        />
      </Modal>
    </div>
  );
};

export default BulkAirtimeReview;
