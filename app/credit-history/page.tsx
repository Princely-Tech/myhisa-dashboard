"use client";
import AxiosHandler from "@/utils/api/axiosHandler";
import { CreditHistory } from "@/utils/types";
import { useEffect, useState } from "react";
import CreditHistoryTable from "./table";
import { Spin } from "antd";
import apiEndpoints from "@/utils/api/apiEndpoints";

const CreditHistoryPage = () => {
  const [data, setData] = useState<CreditHistory | null>(null);
  const apiService = new AxiosHandler();
  useEffect(() => {
    process();
  }, []);
  return (
    <main className="flex-1 border relative px-4 pt-2 pb-5 flex flex-col min-h-screen  overflow-hidden">
      <CreditHistoryTable
        data={data}
        className="min-h-[400px] max-w-full"
      />
      {!data && (
        <div className="absolute top-0 bottom-0 left-0 right-0 flex justify-center items-center">
          <Spin spinning={true} size="large" />
        </div>
      )}
    </main>
  );
  async function process() {
    try {
      const res = await apiService.get({
        endPoint: apiEndpoints.creditHistory,
      });
      setData(res.data);
    } catch (err) {}
  }
};
export default CreditHistoryPage;
