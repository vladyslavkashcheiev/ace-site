import Link from "next/link";
import { requireAce } from "@/lib/guard";
import { cooldownSince } from "@/lib/admins";
import { ACCESS_LABEL, atLeast } from "@/lib/access";
import { avatarUrl, fetchGuildRoleNames } from "@/lib/discord";
import { RANK_ROLES, STAFF_ROLES, ACE_MEMBER_ROLE } from "@/config/discord";
import { lastExamRequests, lastReports, type ExamRow, type ReportRow } from "@/lib/db";
import { rankName, requirementFrom } from "@/lib/ranks";

const STATUS: Record<string, [string, string]> = {
  pending: ["На проверке", "var(--gold)"],
  approved: ["Одобрено", "var(--green)"],
  rejected: ["Отклонено", "var(--red)"],
  accepted: ["Назначено", "var(--green)"],
  passed: ["Сдал", "var(--green)"],
  failed: ["Не сдал", "var(--red)"],
};
const fmt = (d: string) => new Date(d).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Kiev" });

export default async function Profile() {
  const s = await requireAce("/profile");
  let reports: ReportRow[] = [];
  let exams: ExamRow[] = [];
  try {
    [reports, exams] = await Promise.all([lastReports(s.id, 5), lastExamRequests(s.id, 5)]);
  } catch (e) {
    console.error(e);
  }
  let roleNames: Record<string, string> = {};
  if (s.access === "admin") roleNames = await fetchGuildRoleNames().catch(() => ({}));
  const known = new Set<string>([...RANK_ROLES.map((r) => r.id), ...Object.values(STAFF_ROLES), ACE_MEMBER_ROLE].filter(Boolean));
  const rank = s.rankNum;
  const req = rank ? requirementFrom(rank) : null;
  const cdSince = new Date(await cooldownSince(s.id).catch(() => new Date(0).toISOString())).getTime();
  const lastOk = reports.find((r) => r.status !== "rejected" && new Date(r.created_at).getTime() >= cdSince);
  const lastAt = lastOk ? new Date(lastOk.created_at).getTime() : 0;
  const hoursLeft = Math.max(0, Math.ceil((lastAt + 48 * 3600e3 - Date.now()) / 3600e3));

  return (
    <main className="container section">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
        <div className="row" style={{ gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarUrl(s.id, s.avatar)} alt="" width={80} height={80} style={{ border: "2px solid var(--gold)" }} />
          <div className="stack" style={{ gap: 6 }}>
            <span className="eyebrow">// Личный кабинет · {ACCESS_LABEL[s.access]}</span>
            <h1 style={{ fontSize: 40, lineHeight: 1.05 }}>{rank ? rankName(rank) + " " : ""}{s.icName}</h1>
            <span className="muted">Паспорт {s.passport} · @{s.username} · <Link href="/onboarding?next=/profile">изменить</Link></span>
          </div>
        </div>
      </div>

      {atLeast(s.access, "instructor") && (
        <div className="row">
          <Link className="btn" href="/staff">Открыть штаб</Link>
          {s.access === "admin" && <Link className="btn ghost" href="/admin">Админ-панель</Link>}
        </div>
      )}
      {s.access === "admin" && (
        <div className="panel pad stack" style={{ borderColor: "var(--olive)", gap: 8 }}>
          <span className="lbl">Диагностика (видишь только ты)</span>
          {!s.check.ok ? (
            <span style={{ color: "var(--red)" }}>Бот не смог прочитать сервер: {s.check.error}. Проверь DISCORD_BOT_TOKEN в Vercel и что бот добавлен на сервер.</span>
          ) : !s.check.inGuild ? (
            <span style={{ color: "var(--red)" }}>Бот работает, но не нашёл тебя на сервере ACE (ID сервера в настройках сайта может быть другим).</span>
          ) : (
            <>
              <span style={{ color: "var(--green)" }}>Бот видит тебя на сервере. Ролей: {s.check.roles.length}.</span>
              <div className="row" style={{ gap: 6 }}>
                {s.check.roles.map((id) => (
                  <span key={id} className="pill" style={known.has(id) ? { borderColor: "var(--gold)", color: "var(--gold-2)" } : {}}>
                    {roleNames[id] ?? "роль"} <small className="muted">{id}</small>
                  </span>
                ))}
              </div>
              <span className="muted" style={{ fontSize: 14 }}>Золотым выделены роли, которые сайт знает (звания, Cur/Com/D.Com/Inst, общая ACE).</span>
            </>
          )}
        </div>
      )}

      <div className="split">
        <div className="main panel pad stack">
          {rank && req ? (
            <>
              <span className="h3">Следующее звание: {rankName(rank + 1)} · {rank} → {rank + 1}</span>
              <div className="row" style={{ gap: 10 }}>
                <span className="pill">Нужно: <b>{req.ovz ? "ОВЗ (КД раз в день)" : req.byCommand ? "по решению руководства" : `${req.points} баллов`}</b></span>
                {req.exam && <Link className="pill warn" href="/exam">Переаттестация: {req.exam} →</Link>}
                <span className="pill">КД 48 ч: <b>{hoursLeft ? `ещё ${hoursLeft} ч` : "можно подавать"}</b></span>
              </div>
              <div className="row">
                <Link className="btn" href="/report">Подать отчёт</Link>
                <Link className="btn ghost" href="/exam">Записаться на переаттестацию</Link>
              </div>
            </>
          ) : (
            <span className="muted">Звание не найдено среди ролей ACE в Discord. Если ты в ACE — попроси командование выдать роль звания.</span>
          )}
        </div>
        <div className="side panel pad stack" style={{ gap: 0 }}>
          <span className="h3" style={{ paddingBottom: 8 }}>Мои заявки</span>
          {reports.length + exams.length === 0 && <span className="muted">Пока пусто.</span>}
          {reports.map((r) => (
            <div key={"r" + r.id} className="kv" style={{ alignItems: "center" }}>
              <span>Повышение {r.from_rank}→{r.to_rank} · {r.points} б.<br /><small className="muted">{fmt(r.created_at)}</small></span>
              <span style={{ color: (STATUS[r.status] ?? STATUS.pending)[1], fontFamily: "var(--font-head)", fontSize: 12, textTransform: "uppercase" }}>{(STATUS[r.status] ?? STATUS.pending)[0]}</span>
            </div>
          ))}
          {exams.map((e) => (
            <div key={"e" + e.id} className="kv" style={{ alignItems: "center" }}>
              <span>{e.exam}<br /><small className="muted">{e.preferred_time} · подано {fmt(e.created_at)}</small></span>
              <span style={{ color: (STATUS[e.status] ?? STATUS.pending)[1], fontFamily: "var(--font-head)", fontSize: 12, textTransform: "uppercase" }}>{(STATUS[e.status] ?? STATUS.pending)[0]}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
