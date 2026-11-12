"use client";
import { useState } from "react";
import Link from "next/link";
import { ACTIVITIES, rankName, type Requirement } from "@/lib/ranks";
import { Arrow, Check } from "@/components/Icons";

const CHECKS = [
  "Посчитал баллы по системе",
  "Скрины с боди-камерой",
  "Скринам не больше 4 дней",
  "Скрины НЕ из статистики / планшета / логов",
  "Отметки @Cur.ACE @Com.ACE @D.Com.ACE — добавятся автоматически",
];

type Props = { name: string; passport: string; rank: number; req: Requirement; hoursLeft: number };

export default function ReportForm({ name, passport, rank, req, hoursLeft }: Props) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [proof, setProof] = useState("");
  const [checks, setChecks] = useState<boolean[]>([false, false, false, false, false]);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  const total = ACTIVITIES.reduce((s, a) => s + (counts[a.id] ?? 0) * a.points, 0);
  const need = req.points;
  const enough = total >= need;
  const hasLink = /https?:\/\//.test(proof);
  const block =
    hoursLeft > 0 ? `КД: следующий отчёт через ${hoursLeft} ч` :
    !enough ? `Не хватает ${need - total} баллов` :
    !hasLink ? "Добавь ссылку на доказательства" :
    !checks.every(Boolean) ? "Отметь все пункты чек-листа" : "";

  const step = (id: string, d: number) => setCounts((c) => ({ ...c, [id]: Math.max(0, Math.min(99, (c[id] ?? 0) + d)) }));

  async function send() {
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ counts, proof, checks }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка");
      setState("sent");
    } catch (e) {
      setError((e as Error).message);
      setState("idle");
    }
  }

  if (state === "sent")
    return (
      <div className="panel stack" style={{ padding: 48, alignItems: "flex-start" }}>
        <span style={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--gold)", color: "#12150f" }}><Check /></span>
        <h2 style={{ fontSize: 32 }}>Отчёт отправлен</h2>
        <p className="lead">{rank}→{rank + 1} · {total} баллов. Командование отмечено в канале отчётов. Следующий отчёт — не раньше чем через 48 часов.</p>
        <Link className="btn" href="/profile">В кабинет</Link>
      </div>
    );

  const lines = proof.split("\n").filter((l) => l.trim());

  return (
    <div className="split">
      <div className="main stack" style={{ gap: 20 }}>
        <div className="panel pad stack">
          <span className="step-h"><b>1</b>ФИО и номер паспорта</span>
          <span style={{ fontSize: 18 }}>{name} | {passport} <Link href="/onboarding?next=/report" style={{ fontSize: 14, marginLeft: 8 }}>изменить</Link></span>
        </div>

        <div className="panel pad stack">
          <span className="step-h"><b>2</b>Текущий и целевой ранг</span>
          <span style={{ fontSize: 18 }}>{rank}. {rankName(rank)} <span className="code">→</span> {rank + 1}. {rankName(rank + 1)}</span>
          <div className="row" style={{ gap: 10 }}>
            <span className="pill">Нужно: <b>{req.ovz ? "ОВЗ (КД раз в день)" : `${need} баллов`}</b></span>
            {req.exam && <Link className="pill warn" href="/exam">Переаттестация: {req.exam} — записаться →</Link>}
          </div>
          <span className="muted" style={{ fontSize: 14 }}>Звание определено по твоей роли в Discord.</span>
        </div>

        <div className="panel pad stack">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
            <span className="step-h"><b>3</b>Сумма баллов</span>
            <span style={{ fontFamily: "var(--font-head)", fontSize: 28, color: enough ? "var(--green)" : "var(--red)" }}>
              {total}<span className="muted" style={{ fontSize: 15 }}> / {need || "—"}</span>
            </span>
          </div>
          <div className="bar"><span style={{ width: `${need ? Math.min(100, Math.round((total / need) * 100)) : 100}%`, background: enough ? "var(--green-bg)" : "var(--gold)" }} /></div>
          <div>
            {ACTIVITIES.map((a) => {
              const c = counts[a.id] ?? 0;
              return (
                <div key={a.id} className="act">
                  <span style={{ flex: 1, minWidth: 0 }}>{a.label} <span className="muted">· {a.points} б.</span></span>
                  <button type="button" className="stepb" aria-label="Меньше" onClick={() => step(a.id, -1)}>−</button>
                  <span style={{ minWidth: 28, textAlign: "center", fontFamily: "var(--font-head)" }}>{c}</span>
                  <button type="button" className="stepb" aria-label="Больше" onClick={() => step(a.id, 1)}>+</button>
                  <span style={{ minWidth: 52, textAlign: "right", fontFamily: "var(--font-head)", color: "var(--gold-2)" }}>{c ? `+${c * a.points}` : "—"}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel pad stack">
          <span className="step-h"><b>4</b>Доказательства + подпись</span>
          <label className="lbl">По одной ссылке на строку, рядом — что сделано
            <textarea className="inp" value={proof} onChange={(e) => setProof(e.target.value)} placeholder={"https://imgur.com/a/... — вечернее построение 10.11\nhttps://imgur.com/a/... — поставка аптечек"} />
          </label>
        </div>

        <div className="panel pad stack" style={{ borderColor: "var(--olive)" }}>
          <span className="step-h"><b>5</b>Чек-лист перед отправкой</span>
          {CHECKS.map((t, i) => (
            <label key={t} className="chk">
              <input type="checkbox" checked={checks[i]} onChange={() => setChecks((c) => c.map((v, j) => (j === i ? !v : v)))} />
              {t}
            </label>
          ))}
          {error && <div className="err">{error}</div>}
          <div className="row">
            <button className="btn" type="button" disabled={!!block || state === "sending"} onClick={send}>
              {state === "sending" ? "Отправляю…" : "Отправить в Discord"} <Arrow />
            </button>
            {block && <span style={{ color: "var(--red)" }}>{block}</span>}
          </div>
        </div>
      </div>

      <div className="side stack" style={{ position: "sticky", top: 96 }}>
        <span className="lbl">Так увидят в Discord</span>
        <div className="dc">
          <div className="stack" style={{ gap: 2, minWidth: 0 }}>
            <b style={{ color: "#f2f3f5" }}>ACE Портал <span style={{ fontSize: 10, background: "#5865f2", color: "#fff", padding: "1px 4px", borderRadius: 3 }}>БОТ</span></b>
            <span><b>Отчёт на повышение</b> · <span className="dm">@{name}</span></span>
            <span>1.ФИО и номер паспорта: {name} | {passport}</span>
            <span>2.Текущий и целевой ранг: {rank}-&gt;{rank + 1}</span>
            <span>3.Сумма баллов: {total}</span>
            <span style={{ whiteSpace: "pre-line", wordBreak: "break-all" }}>4.Ссылка на доказательства + подпись:{"\n"}{lines.length ? lines.join("\n") : "…"}</span>
            <span>5.<span className="dm">@Cur.ACE</span> <span className="dm">@Com.ACE</span> <span className="dm">@D.Com.ACE</span></span>
          </div>
        </div>
        <div className="panel pad stack" style={{ gap: 8 }}>
          <span className="lbl" style={{ color: "var(--red)" }}>Не засчитываются</span>
          <span style={{ lineHeight: 1.45 }}>Скрины старше 4 дней или без боди-камеры. Скрины со статистики, планшета и логов.</span>
        </div>
      </div>
    </div>
  );
}
