"use client";
import { useEffect, useState } from "react";
import { Alert } from "antd";
import { DownOutlined } from "@ant-design/icons";
import Link from "next/link";
import TransactionGraph from "./TransactionGraph";
import SandboxTools from "./SandboxTools";
import KpiCards from "./KpiCards";
import GoLiveChecklist from "./GoLiveChecklist";
import RecentTransactions from "./RecentTransactions";
import ServiceStatus from "./ServiceStatus";
import { useAsync } from "./useAsync";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import type { TransactionHistory, User } from "@/utils/types";
import { hasAccountPermission, isApproved, isSubLogin } from "@/utils/accountPermissions";
import routes from "@/utils/routes";
import { isSandbox } from "@/utils/environment";
import { formatNaira, lagosGreeting, toLagos } from "@/utils/format";
import { useShell } from "@/components/shell/ShellContext";
import { focusRing, textLink } from "@/components/ui/styles";

const RECENT_COUNT = 8;

function firstName(u: User | null): string {
  if (!u) return "";
  const name = u.sub_login?.name || u.contact_person_name || u.name || "";
  return name.trim().split(/\s+/)[0] ?? "";
}

const Dashboard = () => {
  const { user: sessionUser, me, meLoading, meError, refreshMe, openFundWallet } = useShell();
  // Fresh /me when loaded, cached session user until then.
  const user = me ?? sessionUser;

  // Lagos clock; set after mount so server and client markup match.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30 * 1000);
    return () => clearInterval(id);
  }, []);

  const [activityOpen, setActivityOpen] = useState(false);

  // History/stats/commission endpoints sit behind history.view AND account
  // approval - a sub-login without that grant or a pending account would
  // otherwise get permission errors just from loading the dashboard.
  const canViewHistory = isApproved(user) && hasAccountPermission(user, "history.view");
  const showChecklist = !!user && isApproved(user) && !isSubLogin(user);

  // One history call feeds both the recent table and the checklist's
  // "first transaction" item (no dates = all time; newest first).
  const recent = useAsync<TransactionHistory>(
    async () => {
      const res = await new AxiosHandler().get({
        endPoint: `${apiEndpoints.transactionHistory}?per_page=${RECENT_COUNT}`,
      });
      if (!res?.data) throw new Error("empty history");
      return res.data as TransactionHistory;
    },
    canViewHistory
  );

  // Backend (parallel change) adds low_balance_threshold (kobo) to /me; the
  // banner lights up once it's present and non-zero.
  const lowBalanceThreshold = me?.low_balance_threshold ?? sessionUser?.low_balance_threshold ?? null;
  const balance = me?.wallet?.balance;
  const showLowBalance =
    canViewHistory &&
    typeof lowBalanceThreshold === "number" &&
    lowBalanceThreshold > 0 &&
    typeof balance === "number" &&
    balance < lowBalanceThreshold;

  const name = firstName(user);

  return (
    <div className="flex flex-col gap-[20px] px-[16px] py-[20px] sm:p-[28px]">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="m-0 font-heading text-[22px] font-bold leading-tight tracking-[-0.01em] text-hisa-ink sm:text-[26px]">
          {now ? lagosGreeting(now) : "Welcome"}
          {name ? `, ${name}` : ""}
        </h1>
        {now && (
          <span className="text-sm text-hisa-muted">
            <time dateTime={toLagos(now).format()}>{toLagos(now).format("dddd D MMM · HH:mm")}</time> WAT
          </span>
        )}
      </div>

      {user && !isSubLogin(user) && !isApproved(user) && (
        <Alert
          type={user.registration_query ? "warning" : "info"}
          showIcon
          message={
            user.registration_query
              ? "Action needed on your registration"
              : "Your registration is pending approval"
          }
          description={
            <div>
              <p className="m-0 mb-2">
                {user.registration_query ? (
                  <>
                    <strong>Admin note:</strong> {user.registration_query}
                  </>
                ) : (
                  "Your account is under review and will be approved within a maximum of 24 hours. You can view and update your registration details in the meantime."
                )}
              </p>
              <Link href={routes.profile} className={textLink}>
                Go to My Registration →
              </Link>
            </div>
          }
        />
      )}

      {showLowBalance && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-[10px] rounded-xl border-[1px] border-solid border-[#FECDCA] bg-[#FEF3F2] px-[16px] py-[12px] text-sm text-[#7A271A]"
        >
          <span>
            <strong>Low balance.</strong> Your wallet is below your {formatNaira(lowBalanceThreshold, { decimals: 0 })}{" "}
            alert level. Transactions will fail when it runs out.
          </span>
          <button
            type="button"
            onClick={openFundWallet}
            className={`border-0 bg-transparent p-0 text-sm font-semibold text-[#B42318] underline ${focusRing}`}
          >
            Fund wallet
          </button>
        </div>
      )}

      {/* SANDBOX: test funding tools (sandbox builds, primary login only -
          the backend's sandbox funding routes are PrimaryLoginOnly). */}
      {isSandbox && user && !isSubLogin(user) && <SandboxTools onFunded={() => refreshMe()} />}

      {showChecklist && user && (
        <GoLiveChecklist
          user={user}
          transactionCount={recent.data ? recent.data.total_records ?? recent.data.records?.length ?? 0 : null}
          onFund={openFundWallet}
        />
      )}

      {canViewHistory && (
        <KpiCards me={me} meLoading={meLoading} meError={meError} onRetryMe={refreshMe} onFund={openFundWallet} />
      )}

      <div
        className={`grid grid-cols-1 items-start gap-[14px] ${
          canViewHistory ? "xl:grid-cols-[minmax(0,1fr)_300px]" : "md:max-w-[420px]"
        }`}
      >
        {canViewHistory && (
          <RecentTransactions
            records={recent.data?.records ?? null}
            loading={recent.loading}
            error={recent.error}
            onRetry={() => recent.reload()}
          />
        )}
        <ServiceStatus />
      </div>

      {canViewHistory && (
        <section aria-label="Activity" className="rounded-2xl border-[1px] border-solid border-hisa-border bg-white">
          <h2 className="m-0">
            <button
              type="button"
              aria-expanded={activityOpen}
              aria-controls="dashboard-activity"
              onClick={() => setActivityOpen((o) => !o)}
              className={`flex w-full items-center justify-between rounded-2xl border-0 bg-transparent px-[20px] py-[16px] text-left font-heading text-[17px] font-bold text-hisa-ink ${focusRing}`}
            >
              Activity (last 24 hours)
              <DownOutlined aria-hidden="true" className={`text-xs transition-transform ${activityOpen ? "rotate-180" : ""}`} />
            </button>
          </h2>
          {/* Mounted on first open so the chart's request only runs when wanted. */}
          {activityOpen && (
            <div id="dashboard-activity" className="px-[12px] pb-[12px]">
              <TransactionGraph isAdmin={false} />
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Dashboard;
