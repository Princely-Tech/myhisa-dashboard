"use client";
import apiEndpoints from "@/utils/api/apiEndpoints";
import AxiosHandler from "@/utils/api/axiosHandler";
import { formatDateTimeYYYYMMDD, koboToNaira } from "@/utils/helperfunctions";
import { TransactionStats } from "@/utils/types";
import { faker } from "@faker-js/faker";
import { Spin } from "antd";
import { useEffect, useState } from "react";

const TransactionStatsComponent = () => {
  const [transactionStats, setTransactionStats] =
    useState<TransactionStats | null>(null);
  useEffect(() => {
    process();
  }, []);
  return (
    <div className="mb-4">
      <h3 className="">TransactionStats</h3>
      <Spin spinning={!transactionStats}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {transactionStatsData(transactionStats).map((item, index) => (
            <div
              key={index}
              className="iq-card iq-card-block iq-card-stretch m-0"
            >
              <div className="iq-card-body">
                {item.icon}
                <div className="mt-3">
                  <h2>{item.value}</h2>
                  <p>{item.title}</p>
                </div>
                <div id="ethernet-chart-01"></div>
              </div>
            </div>
          ))}
        </div>
      </Spin>
    </div>
  );
  async function process() {
    const apiService = new AxiosHandler();
    const date = formatDateTimeYYYYMMDD(new Date());
    try {
      const res = await apiService.post({
        endPoint: `${apiEndpoints.transactionStats}?from_date=${date}&to_date=${date}`,
        body: {},
      });
      setTransactionStats(res.data);
    } catch (err) {}
  }
};
const WalletBalances = () => {
  const [wallet, setWallet] = useState<{
    balance: number;
    commission: number;
    bonus: number;
  } | null>(null);
  useEffect(() => {
    process();
  }, []);
  return (
    <div className="iq-card  iq-card-stretch iq-card-height m-0 lg:col-span-2">
      <div className="iq-card-body">
        <Spin spinning={!wallet} tip="Loading" size="large">
          {" "}
          <h4 className="text-uppercase text-black mb-0">Main</h4>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="text-[30px] text-black">
            &#8358; {wallet ? koboToNaira(wallet.balance) : 0}
            </div>
            <div className="text-left grid grid-cols-2 gap-8 sm:block lg:grid xl:grid-cols-3 xl:gap-10">
              {[
                {
                  title: "Commision ",
                  value: wallet ? koboToNaira(wallet.commission) : 0,
                },
                {
                  title: "Bonus",
                  value: wallet ? koboToNaira(wallet.bonus) : 0,
                },
              ].map((item, index) => (
                <div key={index}>
                  {" "}
                  <p className="m-0 text-uppercase font-size-12">
                    {item.title}
                  </p>
                  <div className="mb-1 text-black">&#8358; {item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </Spin>
      </div>
    </div>
  );
  async function process() {
    const apiService = new AxiosHandler();
    try {
      const res = await apiService.get({ endPoint: apiEndpoints.me });
      setWallet(res.data.wallet);
    } catch (err) {}
  }
};

export { WalletBalances, TransactionStatsComponent };

const transactionStatsData = (stats: TransactionStats | null) => {
  if (!stats) {
    stats = {
      date_from: "2024-01-01",
      date_to: "2024-05-01",
      failed: 0,
      internal_error: 0,
      invalid_amount: 0,
      invalid_msisdn: 0,
      others: 0,
      pending: 0,
      telco_error: 0,
      total_successful: 0,
      total_transactions: 0,
      total_unsuccessful: 0,
    };
  }
  return [
    {
      title: "Total Transaction",
      value: stats!.total_transactions,
      icon: (
        <div className="icon iq-icon-box iq-bg-primary rounded">
          <i className="ri-drag-move-2-fill"></i>
        </div>
      ),
    },
    {
      title: "Successful",
      value: stats!.total_successful,
      icon: (
        <div
          className="icon iq-icon-box bg-primary rounded"
          data-wow-delay="0.2s"
        >
          <i className="ri-check-fill"></i>
          {/* <i class="fa-solid fa-check-double"></i> */}
        </div>
      ),
    },
    {
      title: "Failed",
      value: stats!.failed,
      icon: (
        <div
          className="icon iq-icon-box iq-bg-danger rounded"
          data-wow-delay="0.2s"
        >
          <i className="ri-close-line"></i>
        </div>
      ),
    },
    {
      title: "Pending",
      value: stats!.pending,
      icon: (
        <div
          className="icon iq-icon-box iq-bg-success rounded"
          data-wow-delay="0.2s"
        >
          <i className="ri-timer-line"></i>
        </div>
      ),
    },

    {
      title: "Invalid Amount",
      value: stats!.invalid_amount,
      icon: (
        <div
          className="icon iq-icon-box iq-bg-danger rounded"
          data-wow-delay="0.2s"
        >
          <i className="ri-file-warning-fill"></i>
        </div>
      ),
    },
    {
      title: "invalid mssidn",
      value: stats!.invalid_msisdn,
      icon: (
        <div
          className="icon iq-icon-box iq-bg-danger rounded"
          data-wow-delay="0.2s"
        >
          <i className="ri-file-warning-fill"></i>
        </div>
      ),
    },

    {
      title: "telco error",
      value: stats!.telco_error,
      icon: (
        <div
          className="icon iq-icon-box iq-bg-danger rounded"
          data-wow-delay="0.2s"
        >
          <i className="ri-file-warning-fill"></i>
        </div>
      ),
    },
    {
      title: "others",
      value: stats!.others,
      icon: (
        <div className="icon iq-icon-box iq-bg-danger rounded">
          <i className="ri-error-warning-fill"></i>
        </div>
      ),
    },
  ];
};
