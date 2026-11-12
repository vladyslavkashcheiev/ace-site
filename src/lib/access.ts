import { ACE_MEMBER_ROLE, ADMIN_USER_ID, RANK_ROLES, STAFF_ROLES } from "@/config/discord";

export type Access = "guest" | "fighter" | "instructor" | "deputy" | "commander" | "curator" | "admin";

export const ACCESS_LABEL: Record<Access, string> = {
  guest: "Гость",
  fighter: "Боец ACE",
  instructor: "Инструктор",
  deputy: "Зам. командира",
  commander: "Командир",
  curator: "Главный куратор",
  admin: "Администратор",
};

const ORDER: Access[] = ["guest", "fighter", "instructor", "deputy", "commander", "curator", "admin"];
export const atLeast = (a: Access, min: Access) => ORDER.indexOf(a) >= ORDER.indexOf(min);

/** По Discord ID и списку ролей на сервере определяет доступ и звание. */
export function resolveAccess(userId: string, roleIds: string[] | null) {
  const roles = new Set(roleIds ?? []);
  const rank = [...RANK_ROLES].reverse().find((r) => roles.has(r.id)) ?? null;

  let access: Access = "guest";
  if (roleIds) {
    if (rank || (ACE_MEMBER_ROLE && roles.has(ACE_MEMBER_ROLE))) access = "fighter";
    if (roles.has(STAFF_ROLES.instructor)) access = "instructor";
    if (roles.has(STAFF_ROLES.deputy)) access = "deputy";
    if (roles.has(STAFF_ROLES.commander)) access = "commander";
    if (roles.has(STAFF_ROLES.curator)) access = "curator";
  }
  if (userId === ADMIN_USER_ID) access = "admin";

  // Командные роли сами содержат звание: Cur — Генерал-майор, Com — Полковник, D.Com — Подполковник.
  let rankNum = rank?.num ?? null;
  if (roles.has(STAFF_ROLES.curator)) rankNum = Math.max(rankNum ?? 0, 14);
  else if (roles.has(STAFF_ROLES.commander)) rankNum = Math.max(rankNum ?? 0, 13);
  else if (roles.has(STAFF_ROLES.deputy)) rankNum = Math.max(rankNum ?? 0, 12);

  return { access, rankNum };
}
