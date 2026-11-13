"use client";
import { useState } from "react";
import Link from "next/link";
import { EXAMS } from "@/lib/ranks";
import { Arrow, Check } from "@/components/Icons";

const pad = (n: number) => String(n).padStart(2, "0");
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const WD = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
function human(date: string, time: string) {
  if (!date || !time) return "";
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${pad(d)}.${pad(m)} (${WD[dt.getDay()]}) в ${time}`;
}

export default function ExamForm({ name, passport }: { name: string; passport: string }) {
  const [exam, setExam] = useState<string>(EXAMS[0].id);
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState("19:00");
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const when = human(date, time);

  async function send() {
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/exam", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ exam, time: when, comment }) });
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
        <h2 style={{ fontSize: 32 }}>Заявка отправлена</h2>
        <p className="lead">{EXAMS.find((e) => e.id === exam)?.label} · {when}. Инструкторы отмечены в канале заявок на аттестацию.</p>
        <Link className="btn" href="/profile">В кабинет</Link>
      </div>
    );

  return (
    <div className="stack" style={{ gap: 28 }}>
      <div className="stack" style={{ gap: 14 }}>
        <span className="step-h"><b>1</b>Экзамен</span>
        <div className="grid">
          {EXAMS.map((e) => (
            <button key={e.id} type="button" onClick={() => setExam(e.id)} className="tile" style={{ cursor: "pointer", textAlign: "left", color: "var(--text)", fontFamily: "var(--font-body)", ...(e.id === exam ? { borderColor: "var(--gold)", background: "#232a1a", boxShadow: "inset 0 0 0 1px var(--gold)" } : {}) }}>
              <span className="h3" style={{ fontSize: 17 }}>{e.label}</span>
              <span className="muted" style={{ fontSize: 15 }}>{e.desc}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="panel pad stack">
        <span className="step-h"><b>2</b>Когда удобно</span>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          <label className="lbl">Дата<input className="inp picker" type="date" value={date} min={todayIso()} onChange={(e) => setDate(e.target.value)} /></label>
          <label className="lbl">Время<input className="inp picker" type="time" value={time} step={300} onChange={(e) => setTime(e.target.value)} /></label>
        </div>
        {when && <span className="pill warn" style={{ alignSelf: "flex-start", fontSize: 17 }}>🗓 {when}</span>}
        <label className="lbl">Комментарий (необязательно)<input className="inp" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Например: пересдача вождения" /></label>
        <span className="muted">Заявка от: {name} | {passport}</span>
        {error && <div className="err">{error}</div>}
        <div><button className="btn" type="button" disabled={!when || state === "sending"} onClick={send}>{state === "sending" ? "Отправляю…" : "Записаться"} <Arrow /></button></div>
      </div>
    </div>
  );
}
