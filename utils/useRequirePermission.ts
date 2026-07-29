"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiEndpoints from "@/utils/api/apiEndpoints";
import routes from "@/utils/routes";
import { User } from "@/utils/types";
import { hasPermission, isSuperAdmin } from "@/utils/permissions";

// Defense-in-depth for admin pages: the backend already returns 403 for a
// missing permission, this just keeps a staff member without access from
// seeing the page shell/flash of content before that response lands.
// Pass no permission (undefined) for pages that are super-admin-only.
function useRequirePermission(permission?: string) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(apiEndpoints.userSetUrl);
    const user = raw ? (JSON.parse(raw) as User) : null;

    const allowed = permission === undefined ? isSuperAdmin(user) : hasPermission(user, permission);

    if (!allowed) {
      router.replace(routes.dashboard);
      return;
    }

    setAuthorized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission]);

  return authorized;
}

export default useRequirePermission;
