import { Suspense } from "react";
import { TransactionStatsComponent } from "../dashboard/components";

const TransactionStatsPage = () => {
  return (
    <main className="h-screen overflow-auto  flex-1 pt-4 p-4">
      <Suspense>
        <TransactionStatsComponent
          isMainPage={true}
          title="Transaction Stats"
        />
      </Suspense>
    </main>
  );
};

export default TransactionStatsPage;
