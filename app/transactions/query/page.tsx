"use client";
import apiEndpoints from "@/utils/api/apiEndpoints";
import AxiosHandler from "@/utils/api/axiosHandler";
import React, { use } from "react";
import QueryBody from "./QueryBody";
import { QueryGetResponse } from "@/utils/types";

const QueryStatusPage = ({
  searchParams,
}: {
  searchParams: Promise<{ id: string }>;
}) => {
  const params = use(searchParams);
  return <QueryBody id={params.id} />;
};

export default QueryStatusPage;
