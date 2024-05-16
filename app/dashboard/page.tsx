import LastTransaction from "./LastTransaction";
import Clock from "./clock";
import { TransactionStats, WalletBalances } from "./components";

const Dashbaord = () => {
  return (
    <div className="min-w-screen min-h-screen bg-teal-400 p-8">
      <h3 className="">Wallet Balances</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        <WalletBalances />
        <Clock />{" "}
      </div>
      <TransactionStats />
      <LastTransaction />
    </div>
  );
};

export default Dashbaord;
