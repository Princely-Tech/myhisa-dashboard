"use client";
import React, { useEffect, useState } from "react";
import { QueryGetResponse } from "@/utils/types";
import { Card, Descriptions, message, Spin } from "antd";
import { formatDateSideBySide, koboToNaira } from "@/utils/helperfunctions";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import SandboxResolveActions, { isSandboxResolvable } from "@/components/SandboxResolveActions";

const QueryBody = ({ id }: { id: string }) => {
  const [data, setData] = useState<QueryGetResponse["data"]>();
  const [column, setColumn] = useState(2);
  const [messageApi, contextHolder] = message.useMessage();
  const apiService = new AxiosHandler(messageApi);
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1000) {
        setColumn(1); // Set column to 1 for smaller screens
      } else {
        setColumn(2); // Set column to 2 for larger screens
      }
    };

    // Set initial column count based on current screen size
    handleResize();

    // Add event listener to track window resizing
    window.addEventListener("resize", handleResize);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  // SANDBOX: extracted so the sandbox resolve actions can refresh the view.
  const loadTransaction = () =>
    apiService
      .get({
        endPoint: apiEndpoints.transactionQuery(id),
      })
      .then((response: QueryGetResponse) => setData(response.data))
      .catch(() => {});
  useEffect(() => {
    loadTransaction();
  }, [id]);
  if (!data)
    return (
      <div className="flex-1 px-4 pt-2 pb-5 ">
        <Card title="Query Details">
          {contextHolder}
          <div className="flex justify-center items-center min-h-[300px]">
            <Spin size="large" />
          </div>
        </Card>
      </div>
    );

  const telcoLog = data.telco_log;
  const transaction = data.transaction;
  return (
    <div className=" flex-1  px-4 pt-2 pb-5   overflow-auto">
      {" "}
      {contextHolder}
      <Card title="Query Details">
        <div className="flex flex-col gap-[50px] justify-between  ">
          <Card className="whitespace-nowrap">
            <Descriptions title="Transaction Details" bordered column={column}>
              <Descriptions.Item label="Amount">
                {koboToNaira(transaction.amount)}
              </Descriptions.Item>
              <Descriptions.Item label="Network">
                {transaction.network}
              </Descriptions.Item>
              <Descriptions.Item label="Beneficiary/MSIDN">
                {transaction.msisdn}
              </Descriptions.Item>
              <Descriptions.Item label="Service Type">
                {transaction.type}
              </Descriptions.Item>
              <Descriptions.Item label="External Ref">
                {transaction.external_ref}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {transaction.status}
              </Descriptions.Item>
              {/* SANDBOX: resolve a pending sandbox transaction. */}
              {isSandboxResolvable(transaction.status) && (
                <Descriptions.Item label="Sandbox">
                  <SandboxResolveActions
                    reference={transaction.transaction_id}
                    status={transaction.status}
                    onResolved={loadTransaction}
                  />
                </Descriptions.Item>
              )}

              {transaction.type === "Electricity" && (
                <>
                  <Descriptions.Item label="Token">
                    {transaction.token}
                  </Descriptions.Item>
                  <Descriptions.Item label="Beneficiary Name">
                    {transaction.beneficiary_name}
                  </Descriptions.Item>
                  <Descriptions.Item label="Address">
                    {transaction.beneficiary_details}
                  </Descriptions.Item>
                  <Descriptions.Item label="unit">
                    {transaction.unit}
                  </Descriptions.Item>
                </>
              )}
              <Descriptions.Item label="Date">
                {formatDateSideBySide(transaction.created_at)}
              </Descriptions.Item>
            </Descriptions>
          </Card>
          {/* <hr /> */}
          <Card>
            <Descriptions title="Telco Log" bordered column={column}>
              <Descriptions.Item label="Error">
                {telcoLog.error ?? "NIL"}
              </Descriptions.Item>
              <Descriptions.Item label="Response HTTP Code">
                {telcoLog.response_http_code}
              </Descriptions.Item>
              <Descriptions.Item label="Response Status Code">
                {telcoLog.response_status_code}
              </Descriptions.Item>
              <Descriptions.Item label="Response Transaction ID">
                {telcoLog.response_transaction_id}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {telcoLog.status}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      </Card>
    </div>
  );
};

export default QueryBody;
