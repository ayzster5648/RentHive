import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

async function logout(request: Request) {
  await destroySession();
  // 303 forces the redirect to be followed as a GET, so the browser doesn't
  // re-POST to the /login page (which would 405).
  return NextResponse.redirect(new URL("/login", request.url), 303);
}

export async function POST(request: Request) {
  return logout(request);
}

// Also allow GET so a stray navigation to /api/logout still works.
export async function GET(request: Request) {
  return logout(request);
}
