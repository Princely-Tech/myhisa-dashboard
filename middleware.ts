import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import constants from "./utils/constants";
import apiEndpoints from "./utils/api/apiEndpoints";
import routes from "./utils/routes";
import { User } from "./utils/types";

export function middleware(request: NextRequest) {
  const token = request.cookies.get(apiEndpoints.tokenSetUrl);
  if (!token && request.nextUrl.pathname != routes.login) {
    return NextResponse.redirect(
      `${request.nextUrl.origin}${routes.login}`
    );
  }
  if (request.nextUrl.pathname === routes.users) {
    let user = request.cookies.get(apiEndpoints.userSetUrl);
    if (user) {
      let userJson = JSON.parse(user.value) as User;
      if (!(userJson.rank > 0)) {
        return routeToDashboard();
      }
    } else {
      return routeToDashboard();
    }
  }
  return NextResponse.next();
  function routeToDashboard() {
    return NextResponse.redirect(
      `${request.nextUrl.origin}${routes.dashboard}`
    );
  }
}
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
