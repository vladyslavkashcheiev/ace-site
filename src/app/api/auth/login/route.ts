import { NextResponse, type NextRequest } from "next/server";
import { authorizeUrl } from "@/lib/discord";

export async function GET(req: NextRequest) {
  const state = crypto.randomUUID();
  const next = req.nextUrl.searchParams.get("next") ?? "";
  const res = NextResponse.redirect(authorizeUrl(state));
  const opts = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 600 };
  res.cookies.set("oauth_state", state, opts);
  if (next.startsWith("/") && !next.startsWith("//")) res.cookies.set("oauth_next", next, opts);
  return res;
}
