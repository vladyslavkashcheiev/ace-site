import "server-only";
import { redirect } from "next/navigation";
import { getSession, type Session } from "./session";

/** Страница только для бойцов ACE с заполненной анкетой. */
export async function requireAce(next: string): Promise<Session> {
  const s = await getSession();
  if (!s) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (s.access === "guest") redirect("/login?error=not_ace");
  if (!s.icName || !s.passport) redirect(`/onboarding?next=${encodeURIComponent(next)}`);
  return s;
}
