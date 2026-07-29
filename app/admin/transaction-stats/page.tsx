"use client";
import TransactionGraph from "@/app/dashboard/TransactionGraph";
import { Suspense } from "react";
import useRequirePermission from "@/utils/useRequirePermission";

const AdminTransactionStats = () => {
  useRequirePermission("reports.view");
  return (
    <div className="px-8 py-4 flex-1 max-h-full overflow-auto">
      <h2 className="mb-4">Global Transaction Statistics</h2>
      <p className="text-gray-600 mb-6">
        View aggregated transaction trends across all users for the last 24 hours
      </p>
      
      <Suspense fallback={<div>Loading...</div>}>
        <TransactionGraph isAdmin={true} />
      </Suspense>
    </div>
  );
};

export default AdminTransactionStats;
