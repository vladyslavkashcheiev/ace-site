import Link from "next/link";
import Handbook from "@/components/Handbook";
import { Arrow, Icon } from "@/components/Icons";
import { getSession } from "@/lib/session";

const CARDS = [
  { href: "/#guide", t: "Справочник", d: "Повышение, устав, кодекс чести, коды, законы и форма.", go: "Открыть", icon: "M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4zM8 9h8M8 13h6" },
  { href: "/report", t: "Отчёт на повышение", d: "Посчитай баллы, приложи доказательства — уйдёт в Discord.", go: "Подать", icon: "M6 15l6-6 6 6M6 20l6-6 6 6M6 9l6-6 6 6" },
  { href: "/exam", t: "Переаттестация", d: "Запишись на аттестацию для 7 ранга и выше.", go: "Записаться", icon: "M4 5h16v16H4zM4 10h16M9 3v4M15 3v4M9 15l2 2 4-4" },
  { href: "/map", t: "Карта ФЗ", d: "КПП, взлётка, казармы и коды для каждого места.", go: "Смотреть", icon: "M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14" },
];

export default async function Home() {
  const s = await getSession();
  return (
    <main>
      <div className="container">
        <section className="hero">
          <div className="stack" style={{ flex: "1 1 520px", gap: 28, minWidth: 0 }}>
            <div className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="blink" style={{ width: 8, height: 8, background: "#8fbf4a", display: "inline-block" }} />
              Портал подразделения ACE · Army Compartmented Elements
            </div>
            <h1>Служба.<br />Дисциплина.<br /><span style={{ color: "var(--gold)" }}>Рост.</span></h1>
            <p className="lead">Справочник бойца, отчёты на повышение и запись на переаттестацию — в одном месте. Каждая заявка сразу уходит командованию в Discord.</p>
            <div className="row">
              {s && s.access !== "guest" ? (
                <>
                  <Link className="btn" href="/report">Подать отчёт <Arrow /></Link>
                  <Link className="btn ghost" href="/profile">Личный кабинет</Link>
                </>
              ) : (
                <>
                  <a className="btn discord" href="/api/auth/login">Войти через Discord <Arrow /></a>
                  <Link className="btn ghost" href="/#guide">Открыть справочник</Link>
                </>
              )}
            </div>
          </div>
          <div style={{ flex: "0 1 400px", display: "flex", justifyContent: "center" }}>
            <svg width="400" height="400" viewBox="0 0 400 400" style={{ maxWidth: "100%", height: "auto" }} aria-hidden="true">
              <circle cx="200" cy="200" r="190" fill="none" stroke="#2a3121" />
              <circle cx="200" cy="200" r="140" fill="none" stroke="#2a3121" />
              <circle cx="200" cy="200" r="90" fill="none" stroke="#2a3121" />
              <path d="M200 10 V390 M10 200 H390" stroke="#2a3121" />
              <g className="radar"><path d="M200 200 L200 10 A190 190 0 0 1 334 66 Z" fill="rgba(212,180,106,.10)" /><path d="M200 200 L200 10" stroke="#d4b46a" strokeWidth="1.5" opacity=".7" /></g>
              <path d="M200 92 L276 120 V196 C276 246 242 284 200 304 C158 284 124 246 124 196 V120 Z" fill="#171c13" stroke="#d4b46a" strokeWidth="3" />
              <path d="M200 106 L262 129 V196 C262 238 234 270 200 288 C166 270 138 238 138 196 V129 Z" fill="none" stroke="#6f7a4a" strokeWidth="1.5" />
              <path d="M158 222 L200 196 L242 222 M158 248 L200 222 L242 248" fill="none" stroke="#d4b46a" strokeWidth="6" />
              <path d="M200 140 l6 14 15 1-12 9 4 15-13-8-13 8 4-15-12-9 15-1z" fill="#d4b46a" />
              <text x="200" y="350" textAnchor="middle" fontFamily="Russo One, sans-serif" fontSize="22" letterSpacing="10" fill="#d4b46a">ACE</text>
            </svg>
          </div>
        </section>

        <section className="grid" style={{ paddingBottom: 88, gap: 20 }}>
          {CARDS.map((c) => (
            <Link key={c.href} className="card" href={c.href}>
              <span className="ic"><Icon d={c.icon} /></span>
              <span className="t">{c.t}</span>
              <span className="muted" style={{ lineHeight: 1.5 }}>{c.d}</span>
              <span className="go">{c.go} →</span>
            </Link>
          ))}
        </section>
      </div>

      <section id="guide" style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", background: "rgba(23,28,19,.6)", scrollMarginTop: 80 }}>
        <div className="container stack" style={{ padding: "80px 24px", gap: 36 }}>
          <div className="stack" style={{ gap: 12 }}>
            <span className="eyebrow">// Раздел 01</span>
            <h2 style={{ fontSize: 44 }}>Справочник бойца</h2>
          </div>
          <Handbook />
        </div>
      </section>
    </main>
  );
}
