import { requireStaff } from "@/lib/staff";
import { db } from "@/lib/db";
import { avatarUrl, listGuildMembers, type GuildMember } from "@/lib/discord";
import { resolveAccess, ACCESS_LABEL } from "@/lib/access";
import { ACE_MEMBER_ROLE, RANK_ROLES, STAFF_ROLES } from "@/config/discord";
import MemberRow from "./MemberRow";
import AddMember from "./AddMember";
import Admins from "./Admins";
import { ADMIN_USER_ID } from "@/config/discord";

export const metadata = { title: "Админ-панель — ACE" };
export const dynamic = "force-dynamic";

const STAFF = [
  { key: "instructor", label: "Inst" },
  { key: "deputy", label: "D.Com" },
  { key: "commander", label: "Com" },
  { key: "curator", label: "Cur" },
] as const;
const fmt = (d: string) => new Date(d).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Kiev" });

export default async function Admin() {
  const me = await requireStaff("admin", "/admin");

  let members: GuildMember[] = [];
  let loadError = "";
  try {
    members = await listGuildMembers();
  } catch (e) {
    loadError = (e as Error).message;
  }
  const aceIds = new Set<string>([ACE_MEMBER_ROLE, ...RANK_ROLES.map((r) => r.id), ...Object.values(STAFF_ROLES)].filter(Boolean));
  const ace = members.filter((m) => m.roles.some((r) => aceIds.has(r)));

  const ids = ace.map((m) => m.id);
  const { data: adminRows } = await db().from("site_admins").select("discord_id, name, added_by_name").order("created_at");
  const extraAdmins = new Set((adminRows ?? []).map((a) => a.discord_id));
  const [{ data: profiles }, { data: log }] = await Promise.all([
    ids.length ? db().from("profiles").select("discord_id, ic_name, passport").in("discord_id", ids) : Promise.resolve({ data: [] as { discord_id: string; ic_name: string; passport: string }[] }),
    db().from("audit_log").select("*").order("created_at", { ascending: false }).limit(40),
  ]);
  const prof = new Map((profiles ?? []).map((p) => [p.discord_id, p]));

  const rows = ace
    .map((m) => {
      const r0 = resolveAccess(m.id, m.roles);
      const access = extraAdmins.has(m.id) ? ("admin" as const) : r0.access;
      const rankNum = r0.rankNum;
      const rankRole = [...RANK_ROLES].reverse().find((r) => m.roles.includes(r.id));
      const p = prof.get(m.id);
      return {
        m,
        access,
        sortKey: (access === "admin" ? 100 : 0) + (rankNum ?? 0),
        name: p?.ic_name ?? m.nick ?? m.globalName ?? m.username,
        sub: `${ACCESS_LABEL[access]}${p ? ` · паспорт ${p.passport}` : " · не заходил на сайт"} · @${m.username}`,
        rankNum: rankRole?.num ?? null,
      };
    })
    .sort((a, b) => b.sortKey - a.sortKey || a.name.localeCompare(b.name));

  return (
    <main className="container section" style={{ maxWidth: 1320 }}>
      <div className="stack" style={{ gap: 8 }}>
        <span className="eyebrow" style={{ color: "var(--red)" }}>// Доступ только у администратора</span>
        <h1 style={{ fontSize: 40 }}>Админ-панель</h1>
        <p className="lead">Звания, командные роли, приём и увольнение. Всё сразу меняется в Discord и записывается в журнал.</p>
      </div>

      {loadError && (
        <div className="err">
          Не удалось получить список участников: {loadError.slice(0, 200)}
          <br />Включи у бота <b>Server Members Intent</b> (Developer Portal → ACE Портал → Бот) и сделай Redeploy.
        </div>
      )}

      <div className="split">
        <div className="main"><AddMember /></div>
        <div className="side">
          <Admins
            canManage={me.id === ADMIN_USER_ID}
            rows={[
              { id: ADMIN_USER_ID, name: rows.find((r) => r.m.id === ADMIN_USER_ID)?.name ?? "Владелец", addedBy: "", owner: true },
              ...(adminRows ?? []).map((a) => ({ id: a.discord_id, name: a.name ?? a.discord_id, addedBy: a.added_by_name ?? "" })),
            ]}
          />
        </div>
      </div>

      <section className="stack">
        <span className="h3">Личный состав · {rows.length}</span>
        <div className="tab-body" style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 1000 }}>
            <div className="trow head" style={{ gridTemplateColumns: "minmax(200px,1.3fr) minmax(190px,1fr) minmax(240px,1.4fr) 220px" }}>
              <span>Боец</span><span>Звание (роль)</span><span>Командные роли</span><span></span>
            </div>
            {rows.map((r) => (
              <MemberRow
                key={r.m.id}
                id={r.m.id}
                name={r.name}
                sub={r.sub}
                avatar={avatarUrl(r.m.id, r.m.avatar)}
                rankNum={r.rankNum}
                ranks={RANK_ROLES.map(({ num, rank }) => ({ num, rank }))}
                staff={STAFF.map((s) => ({ key: s.key, label: s.label, on: r.m.roles.includes(STAFF_ROLES[s.key]) }))}
                isAdmin={r.access === "admin"}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="stack">
        <span className="h3">Журнал действий</span>
        <div className="panel pad" style={{ paddingTop: 8, paddingBottom: 8 }}>
          {(log ?? []).length === 0 && <span className="muted">Пока пусто.</span>}
          {(log ?? []).map((l) => (
            <div key={l.id} className="kv" style={{ alignItems: "baseline" }}>
              <span><b>{l.actor_name}</b> — {l.action}{l.target_name ? `: ${l.target_name}` : ""}{l.details ? <span className="muted"> · {l.details}</span> : null}</span>
              <small className="muted" style={{ whiteSpace: "nowrap" }}>{fmt(l.created_at)}</small>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
