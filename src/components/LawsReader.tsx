"use client";
import { useEffect, useMemo, useState } from "react";

type Item = { n: string; text: string; sub: string[] };
type Section = { title: string; group?: string; intro?: string[]; items: Item[] };
type Law = { id: string; title: string; kind: string; edition: string; key: boolean; sections: Section[] };

// Быстрые переходы: что армейцу открыть в первую очередь
const QUICK: { law: string; match: string; label: string; why: string }[] = [
  { law: "uak", match: "Глава 18", label: "УАК · Глава 18", why: "Воинские преступления: неисполнение приказа, самоволка, вождение военной техники" },
  { law: "ng", match: "Глава III", label: "Закон о NG · Глава III", why: "Когда можно применять силу и оружие, обязанности часового" },
  { law: "zot", match: "Глава VIII", label: "ЗОТ · Глава VIII", why: "Fort Zancudo как закрытая территория: кто и как может зайти" },
  { law: "chp", match: "Раздел 3", label: "ЧП/ВП · Военное положение", why: "При ВП руководство штатом переходит к Национальной Гвардии" },
  { law: "secret", match: "Глава I", label: "Гостайна · Глава I", why: "Маршруты и объём поставок, расположение техники на ФЗ — гостайна. Важно для ACE" },
  { law: "eth", match: "Глава V", label: "Этический кодекс · Дресс-код", why: "Что можно и нельзя носить, маски, татуировки" },
];

const FORUM_ONLY = [
  { title: "Конституция штата", url: "https://forum.gta5rp.com/threads/konstitucija-shtata-san-andreas.1249981/" },
  { title: "Закон о неприкосновенности должностных лиц", url: "https://forum.gta5rp.com/threads/zakon-o-neprikosnovennosti-dolzhnostnyx-lic-shtata-san-andreas.821969/" },
  { title: "Закон о взаимодействии госструктур", url: "https://forum.gta5rp.com/threads/zakon-o-vzaimodeistvii-gosudarstvennyx-struktur-na-territorii-shtata-san-andreas.1379060/" },
];

const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е");
const itemText = (i: Item) => i.n + " " + i.text + " " + i.sub.join(" ");

function Mark({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const low = norm(text);
  const out: React.ReactNode[] = [];
  let i = 0, k = 0;
  for (;;) {
    const j = low.indexOf(q, i);
    if (j < 0) break;
    out.push(text.slice(i, j), <mark key={k++} className="ng-hl">{text.slice(j, j + q.length)}</mark>);
    i = j + q.length;
  }
  out.push(text.slice(i));
  return <>{out}</>;
}

// [У]***(ФЕДЕРАЛЬНЫЙ) → значки «Уголовная», «Особо тяжкая», «Федеральный»
function Tags({ text }: { text: string }) {
  const m = text.match(/^\[(У|А)\](\**)\s*(?:\(([^)]+)\))?\s*/);
  if (!m) return null;
  const kind = m[1] === "У" ? "Уголовная" : "Админ.";
  const stars = m[2].length;
  return (
    <span className="row" style={{ gap: 6, marginBottom: 4 }}>
      <span className={"law-tag" + (m[1] === "У" ? " red" : "")}>{kind}</span>
      {stars > 0 && <span className="law-tag">{"★".repeat(stars)}</span>}
      {m[3] && <span className="law-tag">{m[3]}</span>}
    </span>
  );
}
const stripTags = (t: string) => t.replace(/^\[(У|А)\]\**\s*(?:\([^)]+\))?\s*/, "");

function ItemRow({ it, q }: { it: Item; q: string }) {
  return (
    <div className="ng-pt">
      <span className="code ng-n">{it.n}</span>
      <div className="stack" style={{ gap: 4 }}>
        <Tags text={it.text} />
        <span><Mark text={stripTags(it.text)} q={q} /></span>
        {it.sub.length > 0 && (
          <ul className="ng-sub">{it.sub.map((s, i) => <li key={i}><Mark text={s} q={q} /></li>)}</ul>
        )}
      </div>
    </div>
  );
}

export default function LawsReader() {
  const [laws, setLaws] = useState<Law[] | null>(null);
  const [err, setErr] = useState(false);
  const [open, setOpen] = useState<{ law: string; sec?: string } | null>(null);
  const [query, setQuery] = useState("");
  const q = norm(query.trim());

  useEffect(() => {
    fetch("/data/laws.json").then((r) => r.json()).then(setLaws).catch(() => setErr(true));
  }, []);

  const hits = useMemo(() => {
    if (!laws || q.length < 2) return null;
    const res: { law: Law; sec: Section; it: Item }[] = [];
    for (const law of laws) for (const sec of law.sections) for (const it of sec.items)
      if (norm(itemText(it)).includes(q)) res.push({ law, sec, it });
    return res;
  }, [laws, q]);

  useEffect(() => {
    if (!open) { return; }
    const el = open.sec ? document.getElementById("law-sec-" + open.sec) : null;
    (el ?? document.querySelector(".tabs-wrap"))?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [open]);

  if (err) return <div className="pad err">Не удалось загрузить законы. Обнови страницу.</div>;
  if (!laws) return <div className="pad muted">Загружаем законы…</div>;

  const law = open ? laws.find((l) => l.id === open.law) : null;

  // ── Чтение одного закона ──
  if (law) {
    return (
      <div className="pad stack" style={{ gap: 14 }}>
        <div className="row" style={{ justifyContent: "space-between", gap: 12 }}>
          <button type="button" className="chip" onClick={() => setOpen(null)}>← Все законы</button>
          <span className="muted" style={{ fontSize: 14 }}>Редакция от {law.edition}</span>
        </div>
        <b className="h3" style={{ fontSize: 22, color: "var(--gold)" }}>{law.title}</b>
        <div className="stack" style={{ gap: 8 }}>
          {law.sections.map((s) => (
            <div key={s.title} className="stack" style={{ gap: 8 }}>
              {s.group && <span className="lbl" style={{ marginTop: 8 }}>{s.group}</span>}
              <details id={"law-sec-" + s.title} className="ng-ch" open={open?.sec === s.title} style={{ scrollMarginTop: 90 }}>
                <summary><b className="h3" style={{ fontSize: 16, letterSpacing: ".03em" }}>{s.title}</b></summary>
                <div className="ng-body">
                  {s.intro?.map((t, i) => <p key={i} style={{ margin: "10px 0 0", color: "var(--text-2)", lineHeight: 1.5 }}>{t}</p>)}
                  {s.items.map((it, i) => <ItemRow key={i} it={it} q="" />)}
                </div>
              </details>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Список законов + поиск ──
  return (
    <div className="pad stack" style={{ gap: 18 }}>
      <input className="inp" type="search" placeholder="Поиск по всем законам: самоволка, маска, 18.2, комендантский час…" value={query} onChange={(e) => setQuery(e.target.value)} />

      {hits ? (
        <div className="stack" style={{ gap: 6 }}>
          <span className="muted" style={{ fontSize: 14 }}>{hits.length ? `Найдено: ${hits.length}${hits.length > 80 ? " (показаны первые 80)" : ""}` : "Ничего не найдено"}</span>
          {hits.slice(0, 80).map((h, i) => (
            <div key={i} className="tile" style={{ gap: 4 }}>
              <button type="button" className="law-crumb" onClick={() => { setOpen({ law: h.law.id, sec: h.sec.title }); setQuery(""); }}>
                {h.law.title} · {h.sec.title} ↗
              </button>
              <ItemRow it={h.it} q={q} />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="stack" style={{ gap: 10 }}>
            <span className="lbl">Важно для армии</span>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
              {QUICK.map((x) => {
                const l = laws.find((l) => l.id === x.law);
                const sec = l?.sections.find((s) => s.title.startsWith(x.match));
                return (
                  <button key={x.label} type="button" className="tile law-btn" style={{ borderTop: "2px solid var(--gold)" }} onClick={() => setOpen({ law: x.law, sec: sec?.title })}>
                    <b className="h3" style={{ fontSize: 15, color: "var(--gold)" }}>{x.label}</b>
                    <span style={{ fontSize: 15, lineHeight: 1.45, color: "var(--text-2)" }}>{x.why}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="stack" style={{ gap: 10 }}>
            <span className="lbl">Все законы — полный текст</span>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
              {laws.map((l) => (
                <button key={l.id} type="button" className="tile law-btn" onClick={() => setOpen({ law: l.id })}>
                  <span className="lbl">{l.kind}</span>
                  <b style={{ fontSize: 18, lineHeight: 1.3 }}>{l.title}</b>
                  <span className="code" style={{ fontSize: 12, letterSpacing: ".1em", marginTop: "auto" }}>
                    ред. {l.edition} · {l.sections.reduce((a, s) => a + s.items.length, 0)} ст.
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="stack" style={{ gap: 8 }}>
            <span className="lbl">Ещё — на форуме</span>
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              {FORUM_ONLY.map((f) => <a key={f.url} className="chip" href={f.url} target="_blank" rel="noopener noreferrer">{f.title} ↗</a>)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
