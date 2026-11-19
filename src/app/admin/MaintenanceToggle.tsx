"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MaintenanceToggle({ on, message, by, at }: { on: boolean; message: string; by?: string | null; at?: string | null }) {
  const router = useRouter();
  const [text, setText] = useState(message);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function save(next: boolean) {
    if (next && !window.confirm("Закрыть сайт для всех? Открытым он останется только для администраторов.")) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/maintenance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ on: next, message: text }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel pad stack" style={{ gap: 12, borderColor: on ? "var(--red-bg)" : "var(--line-2)", background: on ? "rgba(168,67,47,.08)" : undefined }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="h3" style={{ color: on ? "var(--red)" : "var(--gold)" }}>
          Техническое обслуживание · {on ? "ВКЛЮЧЕНО" : "выключено"}
        </span>
        {on && by && <span className="muted" style={{ fontSize: 14 }}>включил {by}{at ? ` · ${new Date(at).toLocaleString("ru-RU", { timeZone: "Europe/Kiev" })}` : ""}</span>}
      </div>
      <span className="muted" style={{ fontSize: 15 }}>
        {on ? "Сайт закрыт: все видят заглушку «Техническое обслуживание», отчёты и заявки не принимаются. Администраторы видят сайт как обычно." : "Закроет сайт для всех, кроме администраторов. Вместо сайта будет страница с бараком, которому меняют колёса."}
      </span>
      <input className="inp" value={text} onChange={(e) => setText(e.target.value)} placeholder="Сообщение на заглушке (необязательно): например «Вернёмся к 20:00»" />
      {err && <div className="err">{err}</div>}
      <div className="row">
        {on ? (
          <button type="button" className="btn" disabled={busy} onClick={() => save(false)}>Выключить и открыть сайт</button>
        ) : (
          <button type="button" className="btn" disabled={busy} style={{ background: "var(--red-bg)", borderColor: "var(--red-bg)", color: "#fff" }} onClick={() => save(true)}>Включить техобслуживание</button>
        )}
        {on && <button type="button" className="btn ghost sm" disabled={busy} onClick={() => save(true)}>Обновить сообщение</button>}
        <a className="btn ghost sm" href="/maintenance-preview" target="_blank">Посмотреть заглушку</a>
      </div>
    </div>
  );
}
