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
  headers.set("Location", request.nextUrl.href);
  headers.set("Set-Cookie", body.cookie);
  return new Response(null, { status: 302, headers });
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
