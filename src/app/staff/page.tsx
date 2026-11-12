import Link from "next/link";
import { requireStaff } from "@/lib/staff";
import { atLeast, ACCESS_LABEL } from "@/lib/access";
import { db } from "@/lib/db";
import { ACTIVITIES, rankName } from "@/lib/ranks";
import ActionBar from "@/components/ActionBar";

export const metadata = { title: "Штаб — ACE" };
export const dynamic = "force-dynamic";

const fmt = (d: string) => new Date(d).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Kiev" });
const ACT = Object.fromEntries(ACTIVITIES.map((a) => [a.id, a.label]));
type Prof = { ic_name: string; passport: string } | null;

export default async function Staff({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const s = await requireStaff("instructor", "/staff");
  const canReview = atLeast(s.access, "deputy");
  const { p = "week" } = await searchParams;
  const since = p === "all" ? "1970-01-01" : new Date(Date.now() - (p === "month" ? 30 : 7) * 864e5).toISOString();

  const [reportsQ, examsQ, ratingQ] = await Promise.all([
    canReview
      ? db().from("promotion_reports").select("id, discord_id, from_rank, to_rank, points, breakdown, proof, created_at, profiles(ic_name, passport)").eq("status", "pending").order("created_at")
      : Promise.resolve({ data: [] as never[] }),
    db().from("exam_requests").select("id, discord_id, exam, preferred_time, comment, status, reviewed_by_name, created_at, profiles(ic_name, passport)").in("status", ["pending", "accepted"]).order("created_at"),
    db().from("promotion_reports").select("discord_id, points, created_at, profiles(ic_name)").eq("status", "approved").gte("created_at", since),
  ]);
  const reports = reportsQ.data ?? [];
  const exams = examsQ.data ?? [];

  const agg = new Map<string, { name: string; points: number; reports: number }>();
  for (const r of ratingQ.data ?? []) {
    const name = (r.profiles as unknown as Prof)?.ic_name ?? r.discord_id;
    const a = agg.get(r.discord_id) ?? { name, points: 0, reports: 0 };
    a.points += r.points;
    a.reports += 1;
    agg.set(r.discord_id, a);
  }
  const rating = [...agg.values()].sort((a, b) => b.points - a.points);
  const max = rating[0]?.points || 1;

  return (
    <main className="container section" style={{ maxWidth: 1320 }}>
      <div className="stack" style={{ gap: 8 }}>
        <span className="eyebrow">// Штаб · {ACCESS_LABEL[s.access]}</span>
        <h1 style={{ fontSize: 40 }}>Штаб ACE</h1>
      </div>

      {canReview && (
        <section className="stack">
          <span className="h3">Отчёты на повышение · {reports.length}</span>
          {reports.length === 0 && <div className="panel pad muted">Новых отчётов нет.</div>}
          {reports.map((r) => {
            const pr = r.profiles as unknown as Prof;
            const bd = Object.entries((r.breakdown ?? {}) as Record<string, number>);
            return (
              <div key={r.id} className="panel pad stack" style={{ gap: 12 }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <span style={{ fontSize: 18 }}><b>{pr?.ic_name}</b> <span className="muted">| {pr?.passport}</span> · {r.from_rank}→{r.to_rank} ({rankName(r.to_rank)})</span>
                  <span className="muted" style={{ fontSize: 14 }}>{fmt(r.created_at)}</span>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <span className="pill">Баллы: <b>{r.points}</b></span>
                  {bd.map(([k, v]) => <span key={k} className="pill">{ACT[k] ?? k} ×{v}</span>)}
                </div>
                <div style={{ whiteSpace: "pre-line", wordBreak: "break-word", fontSize: 15, color: "var(--text-2)", borderLeft: "3px solid var(--line-3)", paddingLeft: 12 }}>
                  {r.proof.split(/(https?:\/\/\S+)/g).map((part: string, i: number) => (/^https?:\/\//.test(part) ? <a key={i} href={part} target="_blank" rel="noopener noreferrer">{part}</a> : part))}
                </div>
                <ActionBar endpoint="/api/staff/report" payload={{ id: r.id }} actions={[
                  { action: "approve", label: "Одобрить и выдать роль", tone: "ok", confirm: `Одобрить повышение ${pr?.ic_name} до «${rankName(r.to_rank)}»?` },
                  { action: "reject", label: "Отклонить", tone: "no", needNote: true },
                ]} />
              </div>
            );
          })}
        </section>
      )}

      <section className="stack">
        <span className="h3">Аттестации · {exams.length}</span>
        {exams.length === 0 && <div className="panel pad muted">Заявок нет.</div>}
        {exams.map((e) => {
          const pr = e.profiles as unknown as Prof;
          const accepted = e.status === "accepted";
          return (
            <div key={e.id} className="panel pad stack" style={{ gap: 12, borderColor: accepted ? "var(--olive)" : undefined }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span style={{ fontSize: 18 }}><b>{pr?.ic_name}</b> <span className="muted">| {pr?.passport}</span> · {e.exam}</span>
                <span className="pill" style={accepted ? { borderColor: "var(--green-bg)", color: "var(--green)" } : {}}>{accepted ? `Назначено · ${e.reviewed_by_name}` : "Новая заявка"}</span>
              </div>
              <span>Время: <b>{e.preferred_time}</b>{e.comment ? ` · ${e.comment}` : ""} <span className="muted">· подано {fmt(e.created_at)}</span></span>
              <ActionBar endpoint="/api/staff/exam" payload={{ id: e.id }} actions={accepted ? [
                { action: "pass", label: "Сдал", tone: "ok" },
                { action: "fail", label: "Не сдал", tone: "no" },
                { action: "reject", label: "Отменить", tone: "plain", needNote: true },
              ] : [
                { action: "accept", label: "Подтвердить запись", tone: "ok" },
                { action: "reject", label: "Отклонить", tone: "no", needNote: true },
              ]} />
            </div>
          );
        })}
      </section>

      <section className="stack">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="h3">Рейтинг по одобренным отчётам</span>
          <div className="row" style={{ gap: 8 }}>
            {[["week", "Неделя"], ["month", "Месяц"], ["all", "Всё время"]].map(([k, l]) => (
              <Link key={k} href={`/staff?p=${k}`} className={"chip" + (p === k ? " on" : "")} style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>{l}</Link>
            ))}
          </div>
        </div>
        <div className="tab-body">
          <div className="trow head" style={{ gridTemplateColumns: "50px 1fr 100px 100px 1.2fr" }}><span>#</span><span>Боец</span><span>Отчётов</span><span>Баллы</span><span>Активность</span></div>
          {rating.length === 0 && <div className="pad muted">За этот период одобренных отчётов нет.</div>}
          {rating.map((r, i) => (
            <div key={r.name + i} className="trow" style={{ gridTemplateColumns: "50px 1fr 100px 100px 1.2fr", alignItems: "center" }}>
              <span className="code">{i + 1}</span><span>{r.name}</span><span>{r.reports}</span><span style={{ color: "var(--gold-2)", fontFamily: "var(--font-head)" }}>{r.points}</span>
              <span className="bar"><span style={{ width: `${Math.max(3, Math.round((r.points / max) * 100))}%`, background: "var(--gold)" }} /></span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
