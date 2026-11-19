import { ACE_MEMBER_ROLE, ADMIN_USER_ID, GROUP_ROLES, RANK_ROLES, STAFF_ROLES } from "@/config/discord";

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
/** Номер ранга из ника вида «[A.ACE | 3]Имя», «[ACE] [10] Имя», «[3][ACE] Имя». */
export function rankFromNick(nick: string | null | undefined): number | null {
  if (!nick) return null;
  const m = nick.match(/\|\s*(\d{1,2})\s*\]/) ?? nick.match(/\[\s*(\d{1,2})\s*[\]|]/);
  const n = m ? Number(m[1]) : NaN;
  return n >= 1 && n <= 16 ? n : null;
}

export function resolveAccess(userId: string, roleIds: string[] | null, nick?: string | null) {
  const roles = new Set(roleIds ?? []);
  const rank = [...RANK_ROLES].reverse().find((r) => roles.has(r.id)) ?? null;

  let access: Access = "guest";
  if (roleIds) {
    const inGroup = roles.has(GROUP_ROLES.academy.id) || roles.has(GROUP_ROLES.enlisted.id);
    if (rank || inGroup || (ACE_MEMBER_ROLE && roles.has(ACE_MEMBER_ROLE))) access = "fighter";
    if (roles.has(STAFF_ROLES.instructor)) access = "instructor";
    if (roles.has(STAFF_ROLES.deputy)) access = "deputy";
    if (roles.has(STAFF_ROLES.commander)) access = "commander";
    if (roles.has(STAFF_ROLES.curator)) access = "curator";
  }
  if (userId === ADMIN_USER_ID) access = "admin";

  // Командные роли сами содержат звание: Cur — Генерал-майор, Com — Полковник, D.Com — Подполковник.
  let rankNum = rank?.num ?? null;
  // Нет роли звания → берём номер из ника, иначе нижний ранг группы, иначе Специалист.
  if (rankNum === null && roleIds && access !== "guest") {
    const fromNick = rankFromNick(nick);
    const g = roles.has(GROUP_ROLES.enlisted.id) ? GROUP_ROLES.enlisted : roles.has(GROUP_ROLES.academy.id) ? GROUP_ROLES.academy : null;
    if (fromNick && (!g || (fromNick >= g.from && fromNick <= g.to))) rankNum = fromNick;
    else if (g) rankNum = g.from === 1 ? 3 : g.from;
    else rankNum = 3;
  }
  if (roles.has(STAFF_ROLES.curator)) rankNum = Math.max(rankNum ?? 0, 14);
  else if (roles.has(STAFF_ROLES.commander)) rankNum = Math.max(rankNum ?? 0, 13);
  else if (roles.has(STAFF_ROLES.deputy)) rankNum = Math.max(rankNum ?? 0, 12);

  return { access, rankNum };
}
