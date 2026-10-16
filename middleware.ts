import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import constants from "./utils/constants";
import apiEndpoints from "./utils/api/apiEndpoints";
import routes from "./utils/routes";
import { User } from "./utils/types";
import type { SessionUser } from "./utils/session";
import { canAccessPage } from "./utils/permissions";
import { canAccessAccountPage } from "./utils/accountPermissions";
import { isSandbox } from "./utils/environment";
import { isStaff, onboardingAllowedPaths, onboardingHome, onboardingStatusOf } from "./utils/onboarding";

export function middleware(request: NextRequest) {
  const token = request.cookies.get(apiEndpoints.tokenSetUrl);
  const publicRoutes = [
    routes.login,
    routes.register,
    routes.verifyEmail,
    routes.forgotPassword,
    routes.resetPassword,
    routes.documentation,
  ];
  // SANDBOX: the test-values page is linked from the sandbox banner on the
  // login/register screens (it shows the test BVN/NIN/RC values) and its
  // backend endpoint is public, so it is public too - sandbox builds only.
  if (isSandbox) {
    publicRoutes.push(routes.sandboxTestValues);
  }
  if (!token && !publicRoutes.includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(
      `${request.nextUrl.origin}${routes.login}`
    );
  }

  const pathname = request.nextUrl.pathname;

  const userCookie = request.cookies.get(apiEndpoints.userSetUrl);
  // The cookie holds the slim SessionUser (utils/session.ts toSessionUser):
  // only read fields listed there. Cast to User for the shared permission
  // helpers, which read nothing else.
  let userJson: User | null = null;
  if (userCookie) {
    try {
      userJson = JSON.parse(userCookie.value) as SessionUser as User;
    } catch {
      userJson = null;
    }
  }

  // A session exists (token + user cookie survived registration/login) but
  // the account's email is still unverified - keep them on the verification
  // screen everywhere else, the same way isGated/canAccessAccountPage below
  // bounce a session to routes.dashboard when it can't be where it is.
  const status = onboardingStatusOf(userJson);
  if (
    userJson &&
    (!userJson.email_verified_at || (status === "email_unverified" && !isStaff(userJson))) &&
    pathname !== routes.verifyEmail &&
    pathname !== routes.documentation &&
    // "Change email" on the verification screen starts a new sign-up, and a
    // forgotten password can be reset from there too.
    pathname !== routes.register &&
    pathname !== routes.forgotPassword &&
    pathname !== routes.resetPassword &&
    // SANDBOX: test values stay reachable before email verification.
    !(isSandbox && pathname === routes.sandboxTestValues)
  ) {
    return NextResponse.redirect(
      `${request.nextUrl.origin}${routes.verifyEmail}?email=${encodeURIComponent(
        userJson.email
      )}`
    );
  }

  // ONBOARDING v2: route on users.onboarding_status (stored at login and
  // refreshed from /me whenever the status changes). An older backend sends
  // no status: then nothing here applies and the approved_at-based gating
  // below (canAccessAccountPage) keeps working as before.
  if (userJson && status) {
    const isOnboardingPath = pathname === routes.onboarding || pathname.startsWith(`${routes.onboarding}/`);
    // Login/register stay reachable (switching accounts), as do the
    // password reset screens and, in sandbox builds, the test values.
    const allowed = onboardingAllowedPaths(userJson, [
      routes.login,
      routes.register,
      routes.forgotPassword,
      routes.resetPassword,
      ...(isSandbox ? [routes.sandboxTestValues] : []),
    ]);
    if (allowed && !allowed.includes(pathname) && pathname !== routes.verifyEmail) {
      const home = onboardingHome(userJson) ?? routes.dashboard;
      return NextResponse.redirect(`${request.nextUrl.origin}${home}`);
    }
    // Approved (and staff) accounts have nothing to do in the wizard; the
    // status page stays reachable (it shows "You're approved").
    if (!allowed && isOnboardingPath && pathname !== routes.onboardingStatus) {
      return routeToDashboard();
    }
  } else if (userJson && pathname.startsWith(`${routes.onboarding}`)) {
    // Old backend without onboarding v2: the wizard can't work.
    return NextResponse.redirect(`${request.nextUrl.origin}${routes.profile}`);
  }

  const isGated =
    pathname.startsWith("/admin") ||
    pathname === routes.users ||
    pathname === routes.walletReconciliation ||
    pathname === routes.telcoReconciliation;

  if (isGated) {
    if (!userJson) {
      return routeToDashboard();
    }

    if (!canAccessPage(userJson, pathname)) {
      return routeToDashboard();
    }
  }

  // Sub-login account-permission gating applies to ordinary self-service
  // pages outside the isGated set above, so it always runs (a primary
  // login is unaffected either way - canAccessAccountPage always allows it).
  if (userJson && !canAccessAccountPage(userJson, pathname)) {
    return routeToDashboard();
  }

  return NextResponse.next();
  function routeToDashboard() {
    return NextResponse.redirect(
      `${request.nextUrl.origin}${routes.dashboard}`
    );
  }
}
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|docs/).*)"],
};
