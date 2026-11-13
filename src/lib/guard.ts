import "server-only";
import { redirect } from "next/navigation";
import { getSession, type Session } from "./session";
import { fetchMemberRoles } from "./discord";
import { accessFor } from "./admins";

export type LiveCheck = { ok: boolean; inGuild: boolean; roles: string[]; error?: string };

/** Свежие роли из Discord (на каждый запрос), чтобы не нужно было перезаходить. */
export async function liveAccess(s: Session): Promise<{ session: Session; check: LiveCheck }> {
  try {
    const m = await fetchMemberRoles(s.id);
    const { access, rankNum } = await accessFor(s.id, m?.roles ?? null);
    return { session: { ...s, access, rankNum }, check: { ok: true, inGuild: !!m, roles: m?.roles ?? [] } };
  } catch (e) {
    return { session: s, check: { ok: false, inGuild: false, roles: [], error: (e as Error).message.slice(0, 200) } };
  }
}

/** Страница только для бойцов ACE с заполненной анкетой. */
export async function requireAce(next: string): Promise<Session & { check: LiveCheck }> {
  const s0 = await getSession();
  if (!s0) redirect(`/login?next=${encodeURIComponent(next)}`);
  const { session: s, check } = await liveAccess(s0);
  if (s.access === "guest") redirect("/login?error=not_ace");
  if (!s.icName || !s.passport) redirect(`/onboarding?next=${encodeURIComponent(next)}`);
  return { ...s, check };
}
