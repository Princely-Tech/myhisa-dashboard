"use client";
import { Suspense, useEffect, useState } from "react";
import { Alert } from "antd";
import Link from "next/link";
import LastTransaction from "./LastTransaction";
import Clock from "./clock";
import { TransactionStatsComponent, WalletBalances } from "./components";
import TransactionGraph from "./TransactionGraph";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { User } from "@/utils/types";
import { hasAccountPermission, isApproved, isSubLogin } from "@/utils/accountPermissions";
import routes from "@/utils/routes";

const Dashbaord = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(apiEndpoints.userSetUrl);
    if (raw) {
      setUser(JSON.parse(raw) as User);
    }
  }, []);

  // These three widgets all pull from history/stats endpoints gated behind
  // history.view AND account approval - both a sub-login without that grant
  // and a still-pending account would otherwise get a permission-denied
  // toast on every dashboard load just from mounting them.
  const canViewHistory = isApproved(user) && hasAccountPermission(user, "history.view");

  return (
    <div className="px-8 py-4 flex-1 max-h-full overflow-auto">
      {!isSubLogin(user) && !isApproved(user) && (
        <Alert
          className="mb-4"
          type={user?.registration_query ? "warning" : "info"}
          showIcon
          message={
            user?.registration_query
              ? "Action needed on your registration"
              : "Your registration is pending approval"
          }
          description={
            <div>
              <p>
                {user?.registration_query ? (
                  <>
                    <strong>Admin note:</strong> {user.registration_query}
                  </>
                ) : (
                  "Your account is under review and will be approved within a maximum of 24 hours. You can view and update your registration details in the meantime."
                )}
              </p>
              <Link href={routes.profile} className="text-blue-700 font-semibold hover:underline">
                Go to My Registration →
              </Link>
            </div>
          }
        />
      )}
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
