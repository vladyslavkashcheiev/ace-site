"use client";
import { useState } from "react";
import places from "@/data/map.json";

export default function MapView() {
  const [sel, setSel] = useState(places[0].id);
  const cur = places.find((p) => p.id === sel) ?? places[0];
  return (
    <div className="split">
      <div className="main stack" style={{ gap: 12 }}>
        <div className="mapbox">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/fz-map.png" alt="Карта Fort Zancudo" />
          {places.map((p) => (
            <button key={p.id} type="button" aria-label={p.name} className={"pin" + (p.id === sel ? " on" : "")} style={{ left: `${p.x}%`, top: `${p.y}%` }} onClick={() => setSel(p.id)}>
              <span className="dot"><span>{p.short}</span></span>
              <span className="tip">{p.name}</span>
            </button>
          ))}
        </div>
        <span className="muted" style={{ fontSize: 14 }}>Наведи на ромб — увидишь название, нажми — описание и коды справа.</span>
      </div>
      <div className="side stack">
        <div className="panel pad stack" style={{ borderColor: "var(--gold)", gap: 14 }}>
          <span className="lbl">{cur.kind}</span>
          <span className="h3" style={{ fontSize: 26, color: "var(--gold-2)" }}>{cur.name}</span>
          <span style={{ fontSize: 17, lineHeight: 1.5, color: "var(--text-2)" }}>{cur.desc}</span>
          <span className="lbl" style={{ paddingTop: 4 }}>Связанные коды</span>
          <div className="row" style={{ gap: 8 }}>
            {cur.codes.length === 0 && <span className="muted">Нет отдельных кодов.</span>}
            {cur.codes.map((c) => (
              <span key={c.c} style={{ display: "inline-flex", flexDirection: "column", gap: 2, padding: "10px 12px", border: "1px solid #4a5536", background: "var(--panel-2)" }}>
                <b className="code" style={{ fontWeight: 400 }}>{c.c}</b><span style={{ fontSize: 14 }}>{c.m}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="stack" style={{ gap: 6 }}>
          {places.map((p) => (
            <button key={p.id} type="button" className={"leg" + (p.id === sel ? " on" : "")} onClick={() => setSel(p.id)}><b>{p.short}</b>{p.name}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
