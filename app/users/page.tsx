"use client";
import AxiosHandler from "@/utils/api/axiosHandler";
import { CreditHistory, UsersList } from "@/utils/types";
import { useEffect, useState } from "react";
import UsersListTable from "./table";
import { Form, Spin, message } from "antd";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { BlueButton, FormField, InputField } from "@/components";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { saveAs } from "file-saver";
import papaparse from "papaparse";
import constants from "@/utils/constants";
import {
  formatDateTimeYYYYMMDD,
  updateSearchParams,
} from "@/utils/helperfunctions";
import dayjs from "dayjs";
import { CustomButton } from "@/components/buttons";

const UsersListPage = () => {
  const [data, setData] = useState<UsersList | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const apiService = new AxiosHandler(messageApi);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const search = searchParams.get(constants.searchParamsKeys.search) ?? "";
  const isFiltering = searchParams.has(constants.searchParamsKeys.isFiltering);

  useEffect(() => {
    process();
  }, [searchParams]);
  return (
    <main className="flex-1 border relative px-4 pt-2 pb-5 flex flex-col min-h-screen  overflow-hidden">
      {contextHolder}
      <div className="flex mt-[10px] mb-[30px] flex-col md:flex-row md:items-center justify-between gap-x-[20px] gap-y-[10px]">
        <header className="text-[30px] font-medium whitespace-nowrap">
          Users
        </header>
        <FormComponent />
      </div>
      <section className="flex flex-1 overflow-hidden">
        <UsersListTable
          router={router}
          data={data}
          className="min-h-[400px] flex-1 h-full overflow-auto"
        />
        {!data && (
          <div className="absolute top-0 bottom-0 left-0 right-0 flex justify-center items-center">
            <Spin spinning={true} size="large" />
          </div>
        )}
      </section>
    </main>
  );
  function onFinish(values: any) {
    const paramValues: { key: string; value: string }[] = [];
    paramValues.push({
      key: constants.searchParamsKeys.isFiltering,
      value: "true",
    });
    paramValues.push({
      key: constants.searchParamsKeys.search,
      value: values.search,
    });
    updateSearchParams({
      values: paramValues,
      pathname: pathname,
      router: router,
      searchParams: searchParams,
    });
  }
  async function process() {
    try {
      const res = await apiService.get({
        endPoint: `${apiEndpoints.users}?search=${search}`,
      });
      setData(res.data);
    } catch (err) {}
  }
  function handleDownloadCSV() {
    const csvOptions = {
      header: true,
      quotes: true,
      delimiter: ",",
      newline: "\r\n",
      encoding: "utf-8",
      skipEmptyLines: true,
      dynamicTyping: false,
    };
    const csvData = papaparse.unparse(data!.users, csvOptions);
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "users-list.csv");
  }
  function FormComponent() {
    const formKey = Math.random() * 1000000;
    return (
      <FormField
        onFinish={onFinish}
        key={formKey}
        initialValues={{
          search: search,
        }}
      >
        <div className="flex gap-[20px] items-start overflow-auto">
          <InputField
            className="h-[50px]"
            inputClassName="h-[44px] min-w-[150px] "
            placeholder="Name/Number"
            showTitle={false}
            formItemProps={{ name: "search" }}
          />
          <BlueButton
            htmlType="submit"
            loading={isFiltering}
            className=" min-w-[100px] min-h-[44px]"
          >
            Filter
          </BlueButton>
          {data && (
            <CustomButton
              onClick={handleDownloadCSV}
              className=" min-w-[100px] min-h-[44px]"
            >
              Export
            </CustomButton>
          )}
        </div>
      </FormField>
    );
  }
};
export default UsersListPage;
