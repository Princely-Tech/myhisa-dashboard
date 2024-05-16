"use client";
import { TransactionTable } from "@/components";
import tableJson from "@/data/tableJson";
import apiEndpoints from "@/utils/api/apiEndpoints";
import AxiosHandler from "@/utils/api/axiosHandler";
import { formatDateSideBySide, formatDateTimeYYYYMMDD } from "@/utils/helperfunctions";
import { TransactionHistory, TransactionItem } from "@/utils/types";
import { Spin } from "antd";
import { useEffect, useState } from "react";
const LastTransaction = () => {
  const [data, setData] = useState<TransactionHistory | null>(null);
  useEffect(() => {
    process();
  }, []);
  return (
    <div>
      <h1 className="text-[30px] font-medium">Last 20 Transactions</h1>
      <Spin spinning={!data} size="large">
        <TransactionTable
          data={data}
          className="h-[400px]"
        />
      </Spin>
    </div>
  );
  async function process() {
    const apiService = new AxiosHandler();
    const date = formatDateTimeYYYYMMDD(new Date());
    try {
      const res = await apiService.get({
        endPoint: `${apiEndpoints.transactionHistory}?from_date=${date}&to_date=${date}&per_page=20`,
      
      });
      setData(res.data);
    } catch (err) {}
  }
};

export default LastTransaction;
