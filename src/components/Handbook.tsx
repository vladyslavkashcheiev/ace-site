"use client";
import { useState } from "react";
import Link from "next/link";
import data from "@/data/handbook.json";

type Tab = "ranks" | "codes" | "laws" | "rules" | "codex" | "uniform" | "base";
const TABS: { id: Tab; label: string }[] = [
  { id: "ranks", label: "Повышение" },
  { id: "codes", label: "Радиокоды" },
  { id: "laws", label: "Законы" },
  { id: "rules", label: "Устав ACE" },
  { id: "codex", label: "Кодекс чести" },
  { id: "uniform", label: "Форма ACE" },
  { id: "base", label: "Fort Zancudo" },
];
const CODE_CATS: { id: keyof typeof data.codes; label: string }[] = [
  { id: "general", label: "Общие" },
  { id: "patrol", label: "Патрульные" },
  { id: "air", label: "Воздушные" },
  { id: "post", label: "Постовая служба" },
  { id: "mp", label: "Вызов MP (911)" },
  { id: "vpf", label: "ВПФ" },
];
const PATROL_PLACES = [
  ["М1", "Правая трасса"], ["М2", "Левая трасса"], ["М3", "10 ГШ"], ["М4", "Палето-Бей"], ["М5", "Сенди-Шорс"], ["М6", "68 трасса"],
  ["М7", "Чумаш"], ["М8", "Город"], ["М9", "Трубы"], ["М10", "Зерно"], ["М11", "ФЗ"],
];

export default function Handbook() {
  const [tab, setTab] = useState<Tab>("ranks");
  const [cat, setCat] = useState<keyof typeof data.codes>("general");
  const [gender, setGender] = useState<"m" | "f">("m");
  const [img, setImg] = useState(false);

  return (
    <div className="tabs-wrap">
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={"tab" + (t.id === tab ? " on" : "")} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="tab-body">
        {tab === "ranks" && (
          <>
            {(() => {
              const cols = { gridTemplateColumns: "90px minmax(0,1.6fr) minmax(0,1.1fr) minmax(0,1.5fr)" };
              return (
                <>
                  <div className="trow head" style={cols}><span>Ранг</span><span>Звание</span><span>Для повышения</span><span>Переаттестация</span></div>
                  {data.ranks.map((r) => (
                    <div key={r.name} className={"trow" + (r.hot ? " hot" : "")} style={cols}>
                      <span className="code">{r.name}</span>
                      <span>{r.from} <span className="muted">→</span> {r.to}</span>
                      <span style={{ color: "var(--gold-2)" }}>{r.need}</span>
                      <span className="muted">{r.exam}</span>
                    </div>
                  ))}
                </>
              );
            })()}
            <div className="grid pad" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
              <div className="info">
                <span className="info-h">Система начисления баллов</span>
                {data.points.map((p) => <div key={p.k} className="kv"><span>{p.k}</span><b>+{p.v}</b></div>)}
              </div>
              <div className="info">
                <span className="info-h">Важные условия</span>
                {data.conds.map((c) => (
                  <div key={c} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #22291c", fontSize: 15, lineHeight: 1.45 }}>
                    <span style={{ color: "var(--red)" }}>!</span>{c}
                  </div>
                ))}
                <Link className="btn sm" href="/report" style={{ marginTop: 14, alignSelf: "flex-start" }}>Подать отчёт на повышение</Link>
              </div>
            </div>
          </>
        )}

        {tab === "codes" && (
          <>
            <div className="row pad" style={{ borderBottom: "1px solid var(--line-2)", gap: 8, padding: "16px 18px" }}>
              {CODE_CATS.map((c) => (
                <button key={c.id} type="button" className={"chip" + (c.id === cat ? " on" : "")} onClick={() => setCat(c.id)}>{c.label}</button>
              ))}
            </div>
            {cat === "patrol" && (
              <div className="row pad" style={{ alignItems: "flex-start", borderBottom: "1px solid var(--line-2)" }}>
                <div className="stack" style={{ flex: "1 1 240px", gap: 8 }}>
                  <span className="lbl">Форма доклада</span>
                  <span>(Место патрулирования) (Тен-код) (Состав)</span>
                  <span className="code" style={{ fontSize: 22, padding: "10px 14px", border: "1px dashed #4a5536", alignSelf: "flex-start" }}>М11 4-1 Состав: 2</span>
                </div>
                <div className="stack" style={{ flex: "2 1 360px", gap: 8 }}>
                  <span className="lbl">Расшифровка мест</span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 6 }}>
                    {PATROL_PLACES.map(([k, v]) => (
                      <span key={k} style={{ display: "flex", gap: 10, padding: "8px 10px", border: "1px solid var(--line)", fontSize: 15 }}><span className="code">{k}</span>{v}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="trow head" style={{ gridTemplateColumns: "140px 1fr" }}><span>Код</span><span>Значение</span></div>
            {data.codes[cat].map((c) => (
              <div key={c.code + c.mean} className="trow" style={{ gridTemplateColumns: "140px 1fr", fontSize: 17 }}>
                <span className="code">{c.code}</span><span>{c.mean}</span>
              </div>
            ))}
            {cat === "vpf" && <div className="pad" style={{ color: "var(--red)" }}>Отправляется в рацию департамента.</div>}
          </>
        )}

        {tab === "laws" && (
          <div className="pad stack">
            <span className="muted">Законы штата, которые обязан знать каждый военнослужащий. Открываются на форуме GTA5RP.</span>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
              {data.laws.map((l) => (
                <a key={l.url} className="tile" href={l.url} target="_blank" rel="noopener noreferrer">
                  <span className="lbl">{l.kind}</span>
                  <b style={{ fontSize: 18, lineHeight: 1.3 }}>{l.title}</b>
                  <span className="code" style={{ fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", marginTop: "auto" }}>Открыть на форуме ↗</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {tab === "rules" && (
          <div className="pad stack">
            <span className="muted">Устав обязателен для всех военнослужащих ACE. Незнание положений не освобождает от ответственности.</span>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
              {data.rules.map((u) => (
                <div key={u.n} className="tile">
                  <span style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                    <span className="code" style={{ fontSize: 18, minWidth: 40 }}>{u.n}</span>
                    <b className="h3" style={{ fontSize: 15, letterSpacing: ".04em" }}>{u.title}</b>
                  </span>
                  {u.items.map((t) => <span key={t} style={{ fontSize: 15, lineHeight: 1.45, color: "var(--text-2)", paddingLeft: 50 }}>{t}</span>)}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "codex" && (
          <div className="pad stack">
            <p style={{ margin: 0, fontSize: 17, lineHeight: 1.5, color: "var(--text-2)", maxWidth: 820 }}>{data.codex.intro}</p>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
              {data.codex.groups.map((g) => (
                <div key={g.title} className="tile">
                  <b className="h3" style={{ color: "var(--gold)" }}>{g.title}</b>
                  {g.items.map((i) => (
                    <span key={i.k} style={{ fontSize: 15, lineHeight: 1.45 }}><b style={{ color: "var(--gold-2)" }}>{i.k}.</b> <span style={{ color: "var(--text-2)" }}>{i.v}</span></span>
                  ))}
                </div>
              ))}
            </div>
            <div className="err">{data.codex.outro}</div>
          </div>
        )}

        {tab === "uniform" && (
          <>
            <div className="row" style={{ padding: "16px 20px", borderBottom: "1px solid var(--line-2)", justifyContent: "space-between" }}>
              <div className="row" style={{ gap: 8 }}>
                <button type="button" className={"chip" + (gender === "m" ? " on" : "")} onClick={() => setGender("m")}>Мужская</button>
                <button type="button" className={"chip" + (gender === "f" ? " on" : "")} onClick={() => setGender("f")}>Женская</button>
              </div>
              <span className="muted" style={{ fontSize: 14 }}>Номера — как в раздевалке фракции</span>
            </div>
            <div className="pad" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 14 }}>
              {data.uniform[gender].map((f) => (
                <div key={f.name} className="uni">
                  <div className="uni-h">
                    <span className="code" style={{ fontSize: 15, textTransform: "uppercase" }}>{f.name}</span>
                    {f.note && <div style={{ fontSize: 13, color: "var(--red)" }}>{f.note}</div>}
                  </div>
                  {f.items.map((it) => <div key={it.k} className="uni-r"><span className="muted">{it.k}</span><span style={{ textAlign: "right" }}>{it.v}</span></div>)}
                </div>
              ))}
            </div>
            <div className="pad stack" style={{ paddingTop: 0 }}>
              <button type="button" className="chip" style={{ alignSelf: "flex-start" }} onClick={() => setImg(!img)}>{img ? "Скрыть схему" : "Показать схему с фото"}</button>
              {img && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={gender === "m" ? "/uniform-male.jpg" : "/uniform-female.jpg"} alt="Схема формы ACE" style={{ width: "100%", border: "1px solid var(--line-2)" }} />
              )}
            </div>
          </>
        )}

        {tab === "base" && (
          <div className="pad stack">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="muted">Где КПП, взлётка, казармы и мосты — смотри на интерактивной карте.</span>
              <Link className="btn sm" href="/map">Открыть карту базы</Link>
            </div>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
              {data.base.map((b) => (
                <div key={b.name} className="tile" style={{ borderTop: "2px solid var(--gold)" }}>
                  <span className="code" style={{ textTransform: "uppercase" }}>{b.name}</span>
                  <span className="muted" style={{ lineHeight: 1.5 }}>{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
