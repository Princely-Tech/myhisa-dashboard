import React from "react";
import QueryBody from "./QueryBody";

const QueryStatusPage = ({
  searchParams,
}: {
  searchParams: Promise<{ id: string }>;
}) => {
  const params = React.use(searchParams); // unwrap the Promise

  return <QueryBody id={params.id} />;
};

export default QueryStatusPage;
