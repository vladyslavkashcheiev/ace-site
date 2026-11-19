"use client";
import { useMemo, useState } from "react";
import ng from "@/data/ng-charter.json";

type Point = { n: string; text: string; sub: string[] };

// Пункты, которые напрямую касаются ACE — подсвечиваются в тексте
const ACE_POINTS = new Set(["5.10", "9.6", "12.2"]);

// Короткая выжимка «что важно знать бойцу ACE»
const BRIEF: { h: string; v: string; ref: string }[] = [
  { h: "Наша задача", v: "ACE — подразделение материально-технического обеспечения: поставки вооружения, боеприпасов, техники и продовольствия, перевозка личного состава.", ref: "9.6" },
  { h: "Наши полномочия", v: "Руководство ACE может наказывать бойцов любых подразделений за парковку и транспорт (Глава XII): зам — до замов, командир — до командиров, куратор — до кураторов.", ref: "5.10, 12.2" },
  { h: "Вечернее построение", v: "Каждый день в 21:00, Ангар A-1. В форме подразделения, без брони, оружия, масок и шлемов. Командир/зам/инструктор докладывает о работе за сутки.", ref: "11.10–11.14" },
  { h: "График", v: "Дневная смена 10:00–22:00 (в выходные с 11:00), ночная 22:00–10:00. Перерыв — с Капрала, до 2 ч в сумме, не в первый и не в последний час смены.", ref: "6.1–6.8" },
  { h: "Отпуск", v: "До 7 календарных дней раз в месяц, минимум 1 день.", ref: "6.10–6.11" },
  { h: "Снять выговор", v: "Устный — 10 000$, выговор — 20 000$, строгий — 30 000$ в казну NG. Или отработка: бег по кишке вокруг Форта / счёт лампочек на ВПП. Выговор от прокуратуры/суда не снимается.", ref: "5.16–5.20" },
  { h: "Сроки", v: "Наказать можно в течение 10 дней после нарушения. Жалоба рассматривается 48 ч, обжаловать взыскание — в течение 48 ч. Доказательства хранить 120 ч.", ref: "5.12, 5.21–5.23" },
  { h: "Повышение", v: "С неснятым взысканием повысить нельзя. Военный билет — со Штаб-сержанта, без взысканий и не раньше 7 дней службы.", ref: "5.2, 10.2–10.3" },
];

function norm(s: string) {
  return s.toLowerCase().replace(/ё/g, "е");
}

function Mark({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const low = norm(text);
  const out: React.ReactNode[] = [];
  let i = 0;
  let k = 0;
  for (;;) {
    const j = low.indexOf(q, i);
    if (j < 0) break;
    out.push(text.slice(i, j));
    out.push(<mark key={k++} className="ng-hl">{text.slice(j, j + q.length)}</mark>);
    i = j + q.length;
  }
  out.push(text.slice(i));
  return <>{out}</>;
}

function PointRow({ p, q }: { p: Point; q: string }) {
  const ace = ACE_POINTS.has(p.n);
  return (
    <div className={"ng-pt" + (ace ? " ace" : "")}>
      <span className="code ng-n">{p.n}</span>
      <div className="stack" style={{ gap: 4 }}>
        <span><Mark text={p.text} q={q} />{ace && <span className="pill" style={{ marginLeft: 8 }}>ACE</span>}</span>
        {p.sub.length > 0 && (
          <ul className="ng-sub">
            {p.sub.map((s) => <li key={s}><Mark text={s} q={q} /></li>)}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function NgCharter() {
  const [query, setQuery] = useState("");
  const q = norm(query.trim());

  const filtered = useMemo(() => {
    if (q.length < 2) return null;
    const hit = (p: Point) => norm(p.n + " " + p.text + " " + p.sub.join(" ")).includes(q);
    return ng.chapters
      .map((c) => ({ ...c, sections: c.sections.map((s) => ({ ...s, points: s.points.filter(hit) })).filter((s) => s.points.length) }))
      .filter((c) => c.sections.length);
  }, [q]);

  const chapters = filtered ?? ng.chapters;
  const total = filtered ? filtered.reduce((a, c) => a + c.sections.reduce((b, s) => b + s.points.length, 0), 0) : 0;

  return (
    <div className="pad stack" style={{ gap: 18 }}>
      <div className="row" style={{ justifyContent: "space-between", gap: 12 }}>
        <span className="muted">
          Основной документ National Guard. Действует с {ng.effective}. Незнание устава не освобождает от ответственности.
        </span>
        <a className="btn sm" href={ng.source} target="_blank" rel="noopener noreferrer">Оригинал на форуме ↗</a>
      </div>

      {!filtered && (
        <div className="stack" style={{ gap: 10 }}>
          <span className="lbl">Главное для бойца ACE</span>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {BRIEF.map((b) => (
              <div key={b.h} className="tile" style={{ borderTop: "2px solid var(--gold)" }}>
                <b className="h3" style={{ fontSize: 15, color: "var(--gold)" }}>{b.h}</b>
                <span style={{ fontSize: 15, lineHeight: 1.45, color: "var(--text-2)" }}>{b.v}</span>
                <span className="code" style={{ fontSize: 12, marginTop: "auto" }}>п. {b.ref}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="stack" style={{ gap: 8 }}>
        <span className="lbl">Полный текст</span>
        <input
          className="inp"
          type="search"
          placeholder="Поиск по уставу: перерыв, парковка, 5.10…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {filtered && <span className="muted" style={{ fontSize: 14 }}>{total ? `Найдено пунктов: ${total}` : "Ничего не найдено"}</span>}
      </div>

      <div className="stack" style={{ gap: 8 }}>
        {chapters.map((c) => (
          <details key={c.n + (filtered ? q : "")} className="ng-ch" open={!!filtered}>
            <summary>
              <span className="code ng-cn">{c.n}</span>
              <b className="h3" style={{ fontSize: 16, letterSpacing: ".04em" }}>{c.title}</b>
            </summary>
            <div className="ng-body">
              {c.sections.map((s, i) => (
                <div key={i} className="stack" style={{ gap: 0 }}>
                  {s.title && <span className="ng-art">{s.title}</span>}
                  {s.points.map((p) => <PointRow key={p.n} p={p} q={q.length >= 2 ? q : ""} />)}
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
