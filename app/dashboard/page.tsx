"use client";
import { Suspense, useEffect, useState } from "react";
import LastTransaction from "./LastTransaction";
import Clock from "./clock";
import { TransactionStatsComponent, WalletBalances } from "./components";
import TransactionGraph from "./TransactionGraph";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { User } from "@/utils/types";
import { hasAccountPermission } from "@/utils/accountPermissions";

const Dashbaord = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(apiEndpoints.userSetUrl);
    if (raw) {
      setUser(JSON.parse(raw) as User);
    }
  }, []);

  // These three widgets all pull from history/stats endpoints gated behind
  // history.view - a sub-login without that grant would otherwise trigger a
  // permission-denied toast on every dashboard load just from mounting them.
  const canViewHistory = hasAccountPermission(user, "history.view");

  return (
    <div className="px-8 py-4 flex-1 max-h-full overflow-auto">
      <h3 className="">Wallet Balances</h3>
      <div className="grid md:grid-cols-2 gap-4 mb-4 lg:grid-cols-3 ">
        <WalletBalances />
        <Clock />
      </div>

      {canViewHistory && (
        <Suspense>
          <TransactionGraph isAdmin={false} />
        </Suspense>
      )}

      {canViewHistory && (
        <Suspense>
          <TransactionStatsComponent />
        </Suspense>
      )}
      {canViewHistory && <LastTransaction />}
    </div>
  );
};

export default Dashbaord;
