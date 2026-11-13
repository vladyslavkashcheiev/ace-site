"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  id: string;
  name: string;
  sub: string;
  avatar: string;
  rankNum: number | null;
  ranks: { num: number; rank: string }[];
  staff: { key: string; label: string; on: boolean }[];
  isAdmin: boolean;
};

export default function MemberRow({ id, name, sub, avatar, rankNum, ranks, staff, isAdmin }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);
  const [firing, setFiring] = useState(false);
  const [reason, setReason] = useState("");

  async function call(op: string, value?: string | number, why = "") {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/member", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: id, op, value, reason: why }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка");
      setMsg({ t: op === "resetCooldown" ? "КД сброшен — можно сразу подать отчёт и заявку на аттестацию" : "Готово — роли в Discord обновлены", ok: true });
      setFiring(false);
      setReason("");
      router.refresh();
    } catch (e) {
      setMsg({ t: (e as Error).message, ok: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="trow" style={{ gridTemplateColumns: "minmax(200px,1.3fr) minmax(190px,1fr) minmax(240px,1.4fr) 220px", alignItems: "center" }}>
      <span style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar} alt="" width={34} height={34} style={{ border: "1px solid var(--line-3)" }} />
        <span style={{ minWidth: 0 }}>
          <b>{name}</b>
          <br />
          <small className="muted">{sub}</small>
        </span>
      </span>
      <select className="inp" style={{ minHeight: 40, fontSize: 15, padding: "6px 10px" }} disabled={busy} value={rankNum ?? ""} onChange={(e) => e.target.value && call("setRank", Number(e.target.value))}>
        <option value="">— без звания ACE —</option>
        {ranks.map((r) => <option key={r.num} value={r.num}>{r.num}. {r.rank}</option>)}
      </select>
      <span className="row" style={{ gap: 6 }}>
        {staff.map((s) => (
          <button key={s.key} type="button" className={"chip" + (s.on ? " on" : "")} style={{ minHeight: 36, padding: "0 10px", fontSize: 11 }} disabled={busy} onClick={() => call("toggleStaff", s.key)} title={s.on ? "Снять роль" : "Выдать роль"}>
            {s.label}
          </button>
        ))}
      </span>
      <span style={{ textAlign: "right", display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
        <button type="button" className="chip" style={{ minHeight: 36, padding: "0 10px" }} disabled={busy} onClick={() => call("resetCooldown")} title="Сбросить ожидание: 48 ч на отчёт и 1 ч на заявку на аттестацию">Сбросить КД</button>
        {!isAdmin && !firing && <button type="button" className="chip" style={{ minHeight: 36, borderColor: "var(--red-bg)", color: "var(--red)" }} disabled={busy} onClick={() => setFiring(true)}>Уволить</button>}
      </span>
      {firing && (
        <div className="row" style={{ gridColumn: "1 / -1", gap: 8, padding: 10, border: "1px dashed var(--red-bg)", background: "rgba(168,67,47,.08)" }}>
          <span>Уволить <b>{name}</b>? Будут сняты все роли ACE (звание, общая ACE, командные).</span>
          <input className="inp" style={{ flex: "1 1 220px", minHeight: 40 }} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Причина: ПСЖ, неактив, нарушение устава…" />
          <button type="button" className="chip" style={{ background: "var(--red-bg)", borderColor: "var(--red-bg)", color: "#fff" }} disabled={busy || !reason.trim()} onClick={() => call("dismiss", undefined, reason)}>Подтвердить</button>
          <button type="button" className="chip" onClick={() => setFiring(false)}>Отмена</button>
        </div>
      )}
      {msg && <span style={{ gridColumn: "1 / -1", fontSize: 14, color: msg.ok ? "var(--green)" : "var(--red)" }}>{msg.t}</span>}
    </div>
  );
}
