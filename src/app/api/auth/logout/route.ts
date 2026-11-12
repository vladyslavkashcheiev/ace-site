import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/discord";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST() {
  const res = NextResponse.redirect(`${siteUrl()}/`, 303);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
