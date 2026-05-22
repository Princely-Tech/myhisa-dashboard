import { Suspense } from "react";
import LastTransaction from "./LastTransaction";
import Clock from "./clock";
import { TransactionStatsComponent, WalletBalances } from "./components";
import TransactionGraph from "./TransactionGraph";

const Dashbaord = () => {
  return (
    <div className="px-8 py-4 flex-1 max-h-full overflow-auto">
      <h3 className="">Wallet Balances</h3>
      <div className="grid md:grid-cols-2 gap-4 mb-4 lg:grid-cols-3 ">
        <WalletBalances />
        <Clock />
      </div>
   
      <Suspense>
        <TransactionGraph isAdmin={false} />
      </Suspense>

      <Suspense>
        <TransactionStatsComponent />
      </Suspense>
      <LastTransaction />
    </div>
  );
};

export default Dashbaord;
