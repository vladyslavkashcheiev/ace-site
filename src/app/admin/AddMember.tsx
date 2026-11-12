"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddMember() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  async function add() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/member", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: id.trim(), op: "add" }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка");
      setMsg({ t: "Принят: выданы роли ACE и «Специалист»", ok: true });
      setId("");
      router.refresh();
    } catch (e) {
      setMsg({ t: (e as Error).message, ok: false });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="panel pad stack" style={{ gap: 10 }}>
      <span className="h3" style={{ color: "var(--gold)" }}>Принять в ACE</span>
      <div className="row" style={{ gap: 10 }}>
        <input className="inp" style={{ flex: "1 1 260px" }} value={id} onChange={(e) => setId(e.target.value)} placeholder="Discord ID бойца (ПКМ по нику → Копировать ID пользователя)" />
        <button type="button" className="btn sm" disabled={busy || !/^\d{15,21}$/.test(id.trim())} onClick={add}>+ Принять</button>
      </div>
      <span className="muted" style={{ fontSize: 14 }}>Человек должен быть на сервере. Получит общую роль ACE и звание «Специалист».</span>
      {msg && <span style={{ color: msg.ok ? "var(--green)" : "var(--red)" }}>{msg.t}</span>}
    </div>
  );
}
