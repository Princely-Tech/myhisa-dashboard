"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiEndpoints from "@/utils/api/apiEndpoints";
import routes from "@/utils/routes";
import { User } from "@/utils/types";
import { isSubLogin } from "@/utils/accountPermissions";

// Defense-in-depth for the sub-login management page: the backend already
// returns 403 for a sub-login trying to manage other sub-logins, this just
// keeps a sub-login session from seeing the page shell before that lands.
function useRequirePrimaryLogin() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(apiEndpoints.userSetUrl);
    const user = raw ? (JSON.parse(raw) as User) : null;

    if (isSubLogin(user)) {
      router.replace(routes.dashboard);
      return;
    }

    setAuthorized(true);
  }, [router]);

  return authorized;
}

export default useRequirePrimaryLogin;
