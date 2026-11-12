import "server-only";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getSession, type Session } from "./session";
import { liveAccess } from "./guard";
import { atLeast, type Access } from "./access";
import { db } from "./db";
import { addRole, removeRole } from "./discord";
import { RANK_ROLES } from "@/config/discord";

export async function requireStaff(min: Access, next: string): Promise<Session> {
  const s0 = await getSession();
  if (!s0) redirect(`/login?next=${encodeURIComponent(next)}`);
  const { session } = await liveAccess(s0);
  if (!atLeast(session.access, min)) redirect("/profile");
  return session;
}

export type Actor = { id: string; name: string; access: Access };

/** Для API: проверяет доступ по свежим ролям. Возвращает актёра или готовый ответ-ошибку. */
export async function apiActor(min: Access): Promise<Actor | NextResponse> {
  const s0 = await getSession();
  if (!s0) return NextResponse.json({ error: "Сначала войди через Discord." }, { status: 401 });
  const { session } = await liveAccess(s0);
  if (!atLeast(session.access, min)) return NextResponse.json({ error: "Недостаточно прав." }, { status: 403 });
  return { id: session.id, name: session.icName ?? session.displayName, access: session.access };
}

export async function audit(actor: Actor, action: string, target?: { id: string; name: string } | null, details?: string) {
  const { error } = await db().from("audit_log").insert({
    actor_id: actor.id,
    actor_name: actor.name,
    action,
    target_id: target?.id ?? null,
    target_name: target?.name ?? null,
    details: details ?? null,
  });
  if (error) console.error("audit insert failed", error);
}

export const rankRoleFor = (num: number) => RANK_ROLES.find((r) => r.num === num) ?? null;

/** Оставляет у человека ровно одну роль звания (или снимает все, если num = null). */
export async function setRankRole(userId: string, currentRoles: string[], num: number | null, reason: string) {
  const target = num ? rankRoleFor(num) : null;
  if (num && !target) throw new Error(`Для звания №${num} нет роли в Discord — выдай вручную.`);
  for (const r of RANK_ROLES) {
    if (currentRoles.includes(r.id) && r.id !== target?.id) await removeRole(userId, r.id, reason);
  }
  if (target && !currentRoles.includes(target.id)) await addRole(userId, target.id, reason);
}
