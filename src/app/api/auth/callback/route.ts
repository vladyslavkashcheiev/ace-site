import { NextResponse, type NextRequest } from "next/server";
import { exchangeCode, fetchMe, fetchMemberRoles, siteUrl } from "@/lib/discord";
import { accessFor } from "@/lib/admins";
import { getProfile } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";

export async function GET(req: NextRequest) {
  const base = siteUrl();
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const saved = req.cookies.get("oauth_state")?.value;
  const next = req.cookies.get("oauth_next")?.value ?? "/profile";

  if (!code || !state || state !== saved) return NextResponse.redirect(`${base}/login?error=state`);

  try {
    const token = await exchangeCode(code);
    const me = await fetchMe(token);
    const member = await fetchMemberRoles(me.id);
    const { access, rankNum } = await accessFor(me.id, member?.roles ?? null);

    let profile = null;
    try {
      profile = await getProfile(me.id);
    } catch (e) {
      console.error("profile lookup failed", e);
    }

    const jwt = await createSessionToken({
      id: me.id,
      username: me.username,
      displayName: member?.nick ?? me.global_name ?? me.username,
      avatar: me.avatar,
      access,
      rankNum,
      icName: profile?.ic_name ?? null,
      passport: profile?.passport ?? null,
    });

    let dest = "/";
    if (access === "guest") dest = "/login?error=not_ace";
    else if (!profile) dest = `/onboarding?next=${encodeURIComponent(next)}`;
    else dest = next;

    const res = NextResponse.redirect(`${base}${dest}`);
    res.cookies.set(SESSION_COOKIE, jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    res.cookies.delete("oauth_state");
    res.cookies.delete("oauth_next");
    return res;
  } catch (e) {
    console.error("auth callback failed", e);
    return NextResponse.redirect(`${base}/login?error=discord`);
  }
}
