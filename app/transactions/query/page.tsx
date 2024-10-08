import apiEndpoints from "@/utils/api/apiEndpoints";
import AxiosHandler from "@/utils/api/axiosHandler";
import React, { useState } from "react";
import QueryBody from "./QueryBody";
import { QueryGetResponse } from "@/utils/types";

const QueryStatusPage = ({
  searchParams,
}: {
  searchParams: { id: string };
}) => {
  return <QueryBody id={searchParams.id} />;
};

export default QueryStatusPage;
