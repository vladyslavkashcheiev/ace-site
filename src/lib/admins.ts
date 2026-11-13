import "server-only";
import { db } from "./db";
import { resolveAccess } from "./access";

/** Дополнительные администраторы сайта (кроме владельца из config). */
export async function siteAdminIds(): Promise<Set<string>> {
  const { data, error } = await db().from("site_admins").select("discord_id");
  if (error) {
    console.error("site_admins", error.message);
    return new Set();
  }
  return new Set((data ?? []).map((r) => r.discord_id));
}

/** resolveAccess + проверка списка администраторов в базе. */
export async function accessFor(userId: string, roles: string[] | null) {
  const r = resolveAccess(userId, roles);
  if (r.access !== "admin" && (await siteAdminIds()).has(userId)) return { ...r, access: "admin" as const };
  return r;
}

/** Начало окна КД 48 ч с учётом ручного сброса админом. */
export async function cooldownSince(discordId: string, hours = 48): Promise<string> {
  const base = Date.now() - hours * 3600e3;
  const { data } = await db().from("profiles").select("cooldown_reset_at").eq("discord_id", discordId).maybeSingle();
  const reset = data?.cooldown_reset_at ? new Date(data.cooldown_reset_at).getTime() : 0;
  return new Date(Math.max(base, reset)).toISOString();
}
