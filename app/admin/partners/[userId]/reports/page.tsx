"use client";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import apiEndpoints from "@/utils/api/apiEndpoints";
import AxiosHandler from "@/utils/api/axiosHandler";
import routes from "@/utils/routes";
import type { User } from "@/utils/types";
import { canViewPartnerReports, hasPermission } from "@/utils/permissions";
import { readStoredUser } from "@/utils/session";
import DailyReportView from "@/components/reports/DailyReportView";
import type { ReportSource } from "@/components/reports/reportUtils";

// Staff view of one partner's daily report (same components as /reports,
// admin endpoints). Viewing needs users.view (the Users page / partner
// details permission) plus reports.view (required by the backend for the
// report endpoints) - canViewPartnerReports, also enforced by middleware
// for /admin/partners/*. Changing the partner's daily email needs
// users.manage.
const AdminPartnerReportsContent = () => {
  const router = useRouter();
  const params = useParams<{ userId: string }>();
  const userId = params?.userId ?? "";
  const [authorized, setAuthorized] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [partner, setPartner] = useState<User | null>(null);

  // Defense-in-depth like useRequirePermission (middleware already gates).
  useEffect(() => {
    const me = readStoredUser();
    if (!canViewPartnerReports(me)) {
      router.replace(routes.dashboard);
      return;
    }
    setCanManage(hasPermission(me, "users.manage"));
    setAuthorized(true);
  }, [router]);

  // Partner name/email for the header and the default recipient. Optional:
  // the report itself carries the partner name.
  useEffect(() => {
    if (!authorized || !/^\d+$/.test(userId)) return;
    let cancelled = false;
    new AxiosHandler()
      .get({ endPoint: apiEndpoints.adminUserProfile(Number(userId)) })
      .then((res) => {
        if (!cancelled && res?.data) setPartner(res.data as User);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [authorized, userId]);

  const source: ReportSource = useMemo(
    () => ({
      daily: (date: string) => apiEndpoints.adminPartnerDailyReport(userId, date),
      exportCsv: (date: string) => apiEndpoints.adminPartnerDailyReportExport(userId, date),
      settings: apiEndpoints.adminPartnerReportSettings(userId),
      pageHref: (date: string) => routes.adminPartnerReports(userId, date),
    }),
    [userId]
  );

  if (!authorized || !userId) return null;

  return (
    <DailyReportView
      source={source}
      title="Partner daily report"
      back={{ href: routes.users, label: "Users" }}
      partnerName={partner?.trading_name || partner?.name}
      csvFallbackName={(date) => `hisa-report-${userId}-${date}.csv`}
      settings={{
        canEdit: canManage,
        defaultEmail: partner?.email ?? null,
        readOnlyNote: "You need the users.manage permission to change this partner's daily email.",
      }}
    />
  );
};

const AdminPartnerReportsPage = () => (
  <Suspense fallback={null}>
    <AdminPartnerReportsContent />
  </Suspense>
);

export default AdminPartnerReportsPage;
