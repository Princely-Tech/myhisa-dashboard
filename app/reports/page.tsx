"use client";
import React, { Suspense, useMemo } from "react";
import apiEndpoints from "@/utils/api/apiEndpoints";
import routes from "@/utils/routes";
import { isSubLogin } from "@/utils/accountPermissions";
import { useShell } from "@/components/shell/ShellContext";
import DailyReportView from "@/components/reports/DailyReportView";
import type { ReportSource } from "@/components/reports/reportUtils";

// Partner daily report. Access mirrors Transactions history: approved
// account, primary login or a sub-login with history.view (middleware via
// ACCOUNT_PAGE_PERMISSIONS / APPROVAL_REQUIRED_PAGES). The email settings
// are editable by the primary login only (PUT me/report-settings is
// PrimaryLoginOnly); sub-logins see them read-only.
const ReportsContent = () => {
  const { user, me } = useShell();
  const current = me ?? user;
  const primary = !!current && !isSubLogin(current);

  const source: ReportSource = useMemo(
    () => ({
      daily: apiEndpoints.meDailyReport,
      exportCsv: apiEndpoints.meDailyReportExport,
      settings: apiEndpoints.meReportSettings,
      pageHref: routes.reportsForDate,
    }),
    []
  );

  return (
    <DailyReportView
      source={source}
      title="Daily report"
      partnerName={current?.sub_login ? current.name : current?.trading_name || current?.name}
      csvFallbackName={(date) => `hisa-report-${date}.csv`}
      settings={{
        canEdit: primary,
        defaultEmail: primary ? current?.email : null,
        readOnlyNote: "Only the account owner can change the daily email settings.",
      }}
    />
  );
};

const ReportsPage = () => (
  // useSearchParams needs a Suspense boundary for static rendering.
  <Suspense fallback={null}>
    <ReportsContent />
  </Suspense>
);

export default ReportsPage;
