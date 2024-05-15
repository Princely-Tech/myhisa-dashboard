import LastTransaction from "./LastTransaction";
import { TransactionStats, WalletBalances } from "./components";

const Dashbaord = () => {
  return (
    <div className="min-w-screen min-h-screen bg-teal-400 p-8">
     <WalletBalances />
     <TransactionStats />
     <LastTransaction />
    </div>
  );
};

export default Dashbaord;
