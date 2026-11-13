"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Row = { id: string; name: string; addedBy: string; owner?: boolean };

export default function Admins({ rows, canManage }: { rows: Row[]; canManage: boolean }) {
  const router = useRouter();
  const [id, setId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);

  async function call(op: "addAdmin" | "removeAdmin", userId: string) {
    if (op === "removeAdmin" && !window.confirm("Снять права администратора сайта?")) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/member", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, op }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка");
      setMsg({ t: op === "addAdmin" ? "Администратор назначен. Ему нужно перезайти на сайт." : "Права сняты.", ok: true });
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
      <span className="h3" style={{ color: "var(--gold)" }}>Администраторы сайта</span>
      {rows.map((r) => (
        <div key={r.id} className="kv" style={{ alignItems: "center" }}>
          <span><b>{r.name}</b> <small className="muted">{r.id}{r.owner ? " · владелец" : ` · назначил ${r.addedBy}`}</small></span>
          {canManage && !r.owner && <button type="button" className="chip" style={{ minHeight: 34, borderColor: "var(--red-bg)", color: "var(--red)" }} disabled={busy} onClick={() => call("removeAdmin", r.id)}>Снять</button>}
        </div>
      ))}
      {canManage ? (
        <div className="row" style={{ gap: 10, paddingTop: 6 }}>
          <input className="inp" style={{ flex: "1 1 260px" }} value={id} onChange={(e) => setId(e.target.value)} placeholder="Discord ID нового администратора" />
          <button type="button" className="btn sm" disabled={busy || !/^\d{15,21}$/.test(id.trim())} onClick={() => call("addAdmin", id.trim())}>+ Назначить</button>
        </div>
      ) : (
        <span className="muted" style={{ fontSize: 14 }}>Назначать администраторов может только владелец сайта.</span>
      )}
      <span className="muted" style={{ fontSize: 14 }}>Администратор видит админ-панель и штаб, может менять звания и роли, сбрасывать КД. Владельца снять нельзя.</span>
      {msg && <span style={{ color: msg.ok ? "var(--green)" : "var(--red)" }}>{msg.t}</span>}
    </div>
  );
}
