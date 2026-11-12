"use client";
import { useState } from "react";
import Link from "next/link";
import { EXAMS } from "@/lib/ranks";
import { Arrow, Check } from "@/components/Icons";

export default function ExamForm({ name, passport }: { name: string; passport: string }) {
  const [exam, setExam] = useState<string>(EXAMS[0].id);
  const [time, setTime] = useState("");
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function send() {
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/exam", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ exam, time, comment }) });
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
        <p className="lead">{EXAMS.find((e) => e.id === exam)?.label} · {time}. Инструкторы отмечены в канале заявок на аттестацию.</p>
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
        <div className="grid">
          <label className="lbl">Удобное время<input className="inp" value={time} onChange={(e) => setTime(e.target.value)} placeholder="Сегодня после 19:00 / 14.11 в 20:00" /></label>
          <label className="lbl">Комментарий (необязательно)<input className="inp" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Например: пересдача вождения" /></label>
        </div>
        <span className="muted">Заявка от: {name} | {passport}</span>
        {error && <div className="err">{error}</div>}
        <div><button className="btn" type="button" disabled={!time.trim() || state === "sending"} onClick={send}>{state === "sending" ? "Отправляю…" : "Записаться"} <Arrow /></button></div>
      </div>
    </div>
  );
}
