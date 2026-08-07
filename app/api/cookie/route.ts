import { CookieSetParams } from "@/utils/types";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest) {
  try {
    const cookieStore = request.cookies;
    const allCookies = cookieStore.getAll();
    const cookies: any = {};
    allCookies.forEach((cookie) => {
      try {
        cookies[cookie.name] = JSON.parse(cookie.value);
      } catch (err) {
        cookies[cookie.name] = cookie.value;
      }
    });
    return new NextResponse(JSON.stringify({ cookies }), {
      status: 200,
    });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
    });
  }
}
export async function POST(request: NextRequest) {
  const body = (await request.json()) as CookieSetParams;
  const headers = new Headers();

  // Callers always bake `Secure` into the cookie string, but browsers
  // silently drop any cookie marked Secure when it didn't arrive over
  // https (e.g. local dev on http://localhost) - the auth middleware then
  // never sees a token cookie and bounces every navigation straight back
  // to the login page, with no visible error anywhere. Strip it unless
  // this request itself came in over https.
  const isHttps =
    request.nextUrl.protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https";
  const cookie = isHttps
    ? body.cookie
    : body.cookie.replace(/;\s*Secure/i, "");

  headers.set("Set-Cookie", cookie);
  return new NextResponse(null, { status: 204, headers });
}
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = request.cookies;
    const allCookies = cookieStore.getAll();
    const headers = new Headers();

    allCookies.forEach((cookie) => {
      headers.append(
        "Set-Cookie",
        `${cookie.name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
      );
    });

    return new NextResponse(null, { status: 204, headers });
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: "Failed to clear cookies" }),
      {
        status: 400,
      }
    );
  }
}
