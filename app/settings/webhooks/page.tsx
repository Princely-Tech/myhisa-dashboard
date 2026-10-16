import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import apiEndpoints from "@/utils/api/apiEndpoints";
import routes from "@/utils/routes";
import type { User } from "@/utils/types";
import PageHeader from "@/components/ui/PageHeader";
import WebhooksTab from "../api-keys/WebhooksTab";

// Webhooks moved into the Developers area (routes.apiKeys, ?tab=webhooks).
// This route stays so existing links/bookmarks keep working:
// - primary logins are redirected there;
// - sub-logins can't open the Developers area (it is primary-only because of
//   the API key), so one with webhooks.manage (enforced by middleware via
//   ACCOUNT_PAGE_PERMISSIONS) gets the same webhooks UI here instead.
// The user cookie is the one middleware.ts reads; if it is missing or
// unreadable we redirect, and middleware then decides what the session may see.
export const dynamic = "force-dynamic";

async function isSubLoginSession(): Promise<boolean> {
  const raw = (await cookies()).get(apiEndpoints.userSetUrl)?.value;
  if (!raw) return false;
  for (const candidate of [raw, safeDecode(raw)]) {
    try {
      return !!(JSON.parse(candidate) as User).sub_login;
    } catch {
      // try the next form
    }
  }
  return false;
}

function safeDecode(v: string): string {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

export default async function LegacyWebhooksPage() {
  if (!(await isSubLoginSession())) {
    redirect(routes.apiKeysTab("webhooks"));
  }
  return (
    <div className="flex flex-col gap-[18px] px-[16px] py-[20px] sm:p-[28px]">
      <PageHeader title="Webhooks" subtitle="Get notified when a network or biller goes down or recovers." />
      <WebhooksTab />
    </div>
  );
}
