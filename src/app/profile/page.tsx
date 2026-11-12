import Link from "next/link";
import { requireAce } from "@/lib/guard";
import { ACCESS_LABEL } from "@/lib/access";
import { avatarUrl } from "@/lib/discord";
import { lastExamRequests, lastReports, type ExamRow, type ReportRow } from "@/lib/db";
import { rankName, requirementFrom } from "@/lib/ranks";

const STATUS: Record<string, [string, string]> = {
  pending: ["На проверке", "var(--gold)"],
  approved: ["Одобрено", "var(--green)"],
  rejected: ["Отклонено", "var(--red)"],
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
  const rank = s.rankNum;
  const req = rank ? requirementFrom(rank) : null;
  const lastAt = reports[0] ? new Date(reports[0].created_at).getTime() : 0;
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
