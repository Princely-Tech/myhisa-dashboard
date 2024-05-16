import LastTransaction from "./LastTransaction";
import Clock from "./clock";
import { TransactionStats, WalletBalances } from "./components";

const Dashbaord = () => {
  return (
    <div className=" bg-teal-400 p-8 flex-1 max-h-full overflow-auto">
      <h3 className="">Wallet Balances</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        <WalletBalances />
        <Clock />
      </div>
      <TransactionStats />
      <LastTransaction />
    </div>
  );
};

export default Dashbaord;
