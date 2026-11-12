import { requireAce } from "@/lib/guard";
import { lastReports } from "@/lib/db";
import { requirementFrom } from "@/lib/ranks";
import ReportForm from "./ReportForm";

export const metadata = { title: "Отчёт на повышение — ACE" };

export default async function ReportPage() {
  const s = await requireAce("/report");
  let hoursLeft = 0;
  try {
    const last = (await lastReports(s.id, 3)).find((r) => r.status !== "rejected");
    if (last) hoursLeft = Math.max(0, Math.ceil((new Date(last.created_at).getTime() + 48 * 3600e3 - Date.now()) / 3600e3));
  } catch (e) {
    console.error(e);
  }
  const rank = s.rankNum;
  const req = rank ? requirementFrom(rank) : null;

  return (
    <main className="container section">
      <div className="stack" style={{ gap: 10 }}>
        <span className="eyebrow">// Порядок повышения ACE</span>
        <h1 style={{ fontSize: 48, lineHeight: 1.05 }}>Отчёт на повышение</h1>
        <p className="lead">Посчитай баллы, приложи доказательства и отметь чек-лист. Отчёт уйдёт в Discord с отметками командования.</p>
      </div>
      {!rank || !req ? (
        <div className="err">Не найдена роль звания ACE в Discord. Попроси командование выдать её и войди заново.</div>
      ) : req.byCommand ? (
        <div className="err">С твоего звания повышение — по решению руководства, отчёт через сайт не подаётся.</div>
      ) : (
        <ReportForm name={s.icName!} passport={s.passport!} rank={rank} req={req} hoursLeft={hoursLeft} />
      )}
    </main>
  );
}
