"use client";
import React from "react";
import QueryBody from "./QueryBody";

const QueryStatusPage = ({
  searchParams,
}: {
  searchParams: { id: string };
}) => {
  return <QueryBody id={searchParams.id} />;
};

export default QueryStatusPage;