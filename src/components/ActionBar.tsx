"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type ActionDef = { action: string; label: string; tone?: "ok" | "no" | "plain"; needNote?: boolean; confirm?: string };

export default function ActionBar({ endpoint, payload, actions }: { endpoint: string; payload: Record<string, unknown>; actions: ActionDef[] }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);

  async function run(a: ActionDef) {
    if (a.needNote && !note.trim()) return setMsg({ t: "Напиши причину / комментарий в поле.", ok: false });
    if (a.confirm && !window.confirm(a.confirm)) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, action: a.action, op: a.action, note, reason: note }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка");
      setMsg({ t: data.roleNote || "Готово", ok: true });
      setNote("");
      router.refresh();
    } catch (e) {
      setMsg({ t: (e as Error).message, ok: false });
    } finally {
      setBusy(false);
    }
  }

  const style = (tone?: string) =>
    tone === "ok" ? { background: "var(--green-bg)", borderColor: "var(--green-bg)", color: "#0f120c" } :
    tone === "no" ? { background: "transparent", borderColor: "var(--red-bg)", color: "var(--red)" } : {};

  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="row" style={{ gap: 8 }}>
        <input className="inp" style={{ flex: "1 1 220px", minHeight: 42 }} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Комментарий / причина" />
        {actions.map((a) => (
          <button key={a.action} type="button" className="chip" disabled={busy} style={{ minHeight: 42, ...style(a.tone) }} onClick={() => run(a)}>
            {a.label}
          </button>
        ))}
      </div>
      {msg && <span style={{ fontSize: 14, color: msg.ok ? "var(--green)" : "var(--red)" }}>{msg.t}</span>}
    </div>
  );
}
