import { Suspense } from "react";
import LastTransaction from "./LastTransaction";
import Clock from "./clock";
import { TransactionStatsComponent, WalletBalances } from "./components";

const Dashbaord = () => {
  return (
    <div className="px-8 py-4 flex-1 max-h-full overflow-auto">
      <h3 className="">Wallet Balances</h3>
      <div className="grid sm:grid-cols-2 gap-4 mb-4 lg:grid-cols-3 ">
        <WalletBalances />
        <Clock />
      </div>
   
      <Suspense>
      <TransactionStatsComponent />
      </Suspense>
      <LastTransaction />
    </div>
  );
};

export default Dashbaord;
