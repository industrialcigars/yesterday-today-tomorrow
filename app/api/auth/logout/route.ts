import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { absoluteUrl } from "@/lib/url";

export async function POST() {
  const response = NextResponse.redirect(absoluteUrl("/login"));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
