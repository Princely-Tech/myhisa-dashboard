"use client";
import { BlueLink, InputField } from "@/components";
import apiEndpoints from "@/utils/api/apiEndpoints";
import AxiosHandler from "@/utils/api/axiosHandler";
import constants from "@/utils/constants";
import {
  formatDateTimeYYYYMMDD,
  updateSearchParams,
} from "@/utils/helperfunctions";
import routes from "@/utils/routes";
import { TransactionStats } from "@/utils/types";
import { Spin, message } from "antd";
import dayjs from "dayjs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const TransactionStatsComponent = ({
  title = "Today’s Transaction Stats",
  isMainPage = false,
}: {
  title?: string;
  isMainPage?: boolean;
}) => {
  const [transactionStats, setTransactionStats] =
    useState<TransactionStats | null>(null);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const currentDate = new Date();
  const toDate =
    searchParams.get(constants.searchParamsKeys.toDate) ??
    formatDateTimeYYYYMMDD(currentDate);
  const fromDate =
    searchParams.get(constants.searchParamsKeys.fromDate) ??
    formatDateTimeYYYYMMDD(currentDate);
  useEffect(() => {
    process();
  }, [searchParams]);
  const [messageApi, contextHolder] = message.useMessage();
  const apiService = new AxiosHandler(messageApi);
  const dateFormat = "yyyy/mm/dd";
  return (
    <div className="mb-4">
      {contextHolder}{" "}
      <div className="flex flex-wrap gap-5 justify-between items-center mb-3">
        <h3>
          {title}
          {transactionStats != null && (
            <span>
              ({transactionStats.date_from} - {transactionStats.date_to})
            </span>
          )}
        </h3>
        {isMainPage ? (
          <div className="flex gap-3">
            <InputField
              placeholder="Date Range"
              className="max-h-[50px]"
              type="date-range"
              dateRangePickerProps={{
                defaultValue: [dayjs(fromDate), dayjs(toDate)],
                placeholder: ["From Date", "To Date"],
                onChange: (input) => {
                  if (!input || !input[0] || !input[1]) return;
                  const fromDateDate = input[0].toDate();
                  const toDateDate = input[1].toDate();
                  const dates: { key: string; value: string }[] = [];
                  if (fromDateDate) {
                    dates.push({
                      key: constants.searchParamsKeys.fromDate,
                      value: formatDateTimeYYYYMMDD(fromDateDate),
                    });
                  }
                  if (toDateDate) {
                    dates.push({
                      key: constants.searchParamsKeys.toDate,
                      value: formatDateTimeYYYYMMDD(toDateDate),
                    });
                  }
                  updateSearchParams({
                    values: dates,
                    pathname: pathname,
                    router: router,
                    searchParams: searchParams,
                  });
                },
                maxDate: dayjs(new Date()),
              }}
            />
            <small>Range must not be more than 6 months</small>
          </div>
        ) : (
          <BlueLink href={routes.transactionStats}>View More</BlueLink>
        )}
      </div>
      <Spin spinning={!transactionStats}>
        <div
          className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${
            !isMainPage && "xl:grid-cols-4"
          }`}
        >
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
    try {
      const res = await apiService.post({
        endPoint: `${apiEndpoints.transactionStats}?${constants.searchParamsKeys.fromDate}=${fromDate}&${constants.searchParamsKeys.toDate}=${toDate}`,
        body: {},
      });
      setTransactionStats(res.data);
    } catch (err) {
      console.error("error occurred");
      console.error(err);
    }
  }
};
export { TransactionStatsComponent };

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
