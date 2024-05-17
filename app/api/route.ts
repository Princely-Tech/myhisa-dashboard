import { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
    const requestHeaders = new Headers(request.headers);
    const res = await fetch(request);
    const data = await res.json();
    return Response.json(data)
  }