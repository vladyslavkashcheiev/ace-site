import { Shield } from "./Icons";

function Wheel() {
  return (
    <>
      <circle r="40" fill="#161616" />
      <circle r="35" fill="none" stroke="#2c2c2c" strokeWidth="6" strokeDasharray="5 4" />
      <circle r="21" fill="#3b4430" stroke="#6b6b5a" strokeWidth="2" />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 13} cy={Math.sin((a * Math.PI) / 180) * 13} r="2.6" fill="#9a9a86" />
      ))}
      <circle r="6" fill="#d4b46a" />
      <path d="M-21 0H21" stroke="#2a3020" strokeWidth="2" />
    </>
  );
}

/** Сцена: бараку поддомкрачивают перед, меняют колесо и закручивают гайки. Крутится по кругу как загрузка. */
function BarracksScene() {
  return (
    <svg viewBox="0 0 900 360" width="100%" role="img" aria-label="Бараку меняют колесо">
      <defs>
        <pattern id="mt-camo" width="120" height="80" patternUnits="userSpaceOnUse">
          <rect width="120" height="80" fill="#d8c79c" />
          <path d="M10 20 Q30 5 55 18 T95 22 Q80 40 50 36 T10 20Z" fill="#b99a68" />
          <path d="M70 55 Q90 45 112 58 Q100 72 78 70Z" fill="#a7895b" />
          <path d="M0 60 Q15 50 30 62 Q18 74 0 70Z" fill="#c2a876" />
        </pattern>
      </defs>

      {/* земля */}
      <rect x="0" y="330" width="900" height="30" fill="#1c2116" />
      <path d="M0 330H900" stroke="#4a5536" strokeWidth="2" />
      <path d="M40 345H130M260 345H350M480 345H570M700 345H790" stroke="#d4b46a" strokeWidth="4" opacity=".35" />

      {/* домкрат под передней осью */}
      <g className="mt-jack">
        <rect x="150" y="320" width="56" height="10" fill="#8a2f22" />
        <path d="M160 320 L178 292 L196 320 M160 292 L196 320 M196 292 L160 320" stroke="#c0442f" strokeWidth="5" fill="none" />
        <rect x="160" y="286" width="36" height="8" fill="#c0442f" />
      </g>

      {/* корпус: наклоняется вокруг задних колёс, когда поднимают перед */}
      <g className="mt-truck">
        <rect x="140" y="262" width="640" height="16" fill="#2b2f24" />
        {/* кузов + тент */}
        <rect x="390" y="176" width="388" height="88" fill="url(#mt-camo)" stroke="#8c7a52" strokeWidth="2" />
        {[430, 490, 550, 610, 670, 730].map((x) => (
          <path key={x} d={`M${x} 178V262`} stroke="#8c7a52" strokeWidth="2" />
        ))}
        <path d="M390 222H778" stroke="#8c7a52" strokeWidth="2" />
        <path d="M392 178 Q402 104 470 104 L560 101 Q600 94 640 104 L742 106 Q782 114 778 178 Z" fill="#c8b788" stroke="#9c8b5f" strokeWidth="2" />
        <path d="M470 104 Q478 140 470 178 M640 104 Q648 140 640 178" stroke="#a8986b" strokeWidth="2" fill="none" />
        {/* кабина */}
        <path d="M222 264 L222 154 Q224 136 244 134 L366 132 Q380 134 382 150 L384 264 Z" fill="url(#mt-camo)" stroke="#8c7a52" strokeWidth="2" />
        <rect x="236" y="146" width="66" height="50" rx="4" fill="#1c2116" stroke="#6b6b5a" strokeWidth="2" />
        <rect x="312" y="146" width="56" height="50" rx="4" fill="#1c2116" stroke="#6b6b5a" strokeWidth="2" />
        <circle cx="340" cy="228" r="16" fill="none" stroke="#f3eedc" strokeWidth="3" />
        <path d="M340 216 l3.5 8 8.5.6-6.5 5.4 2 8.4-7.5-4.6-7.5 4.6 2-8.4-6.5-5.4 8.5-.6z" fill="#f3eedc" />
        <rect x="372" y="86" width="12" height="52" rx="4" fill="#2b2f24" />
        {/* капот и бампер */}
        <path d="M104 264 L104 204 Q106 190 122 188 L224 186 L224 264 Z" fill="url(#mt-camo)" stroke="#8c7a52" strokeWidth="2" />
        <rect x="110" y="200" width="34" height="56" fill="#cdbb8b" stroke="#8c7a52" strokeWidth="2" />
        {[210, 220, 230, 240].map((y) => (
          <path key={y} d={`M112 ${y}H142`} stroke="#8c7a52" strokeWidth="2" />
        ))}
        <path d="M92 196 V256 M92 196 H112 M92 226 H112" stroke="#9c8b5f" strokeWidth="4" fill="none" />
        <rect x="76" y="254" width="74" height="22" fill="#cdbb8b" stroke="#8c7a52" strokeWidth="2" />
        <path d="M80 258 l10 14 M92 258 l10 14 M104 258 l10 14" stroke="#c0442f" strokeWidth="4" />
        {/* задние колёса */}
        <g transform="translate(600 290)"><Wheel /></g>
        <g transform="translate(704 290)"><Wheel /></g>
      </g>

      {/* передняя ось: поднимается вместе с корпусом */}
      <g className="mt-front">
        <g className="mt-old">
          <g transform="translate(180 290)">
            <g className="mt-spin-old"><Wheel /></g>
          </g>
        </g>
        <g className="mt-new">
          <g transform="translate(180 290)">
            <g className="mt-spin-new"><Wheel /></g>
          </g>
        </g>
        {/* ключ закручивает гайки */}
        <g className="mt-wrench">
          <path d="M180 290 L246 238" stroke="#cfd2c4" strokeWidth="9" strokeLinecap="round" />
          <circle cx="180" cy="290" r="10" fill="none" stroke="#cfd2c4" strokeWidth="6" />
          <path d="M240 232 l14 4 -4 14" stroke="#cfd2c4" strokeWidth="6" fill="none" />
        </g>
      </g>
    </svg>
  );
}

export default function Maintenance({ message }: { message?: string }) {
  return (
    <main className="mt-wrap">
      <div className="mt-bg" aria-hidden="true" />
      <div className="mt-card">
        <div className="mt-logo">
          <Shield size={44} />
          <span>
            <b>ACE</b>
            <small>Army Compartmented Elements</small>
          </span>
        </div>
        <div className="mt-scene">
          <BarracksScene />
        </div>
        <span className="eyebrow mt-eyebrow">
          <span className="blink" style={{ width: 8, height: 8, background: "#d4b46a", display: "inline-block" }} />
          Сайт временно закрыт
        </span>
        <h1 className="mt-title">Техническое обслуживание</h1>
        <p className="mt-sub">
          Меняем колёса на бараке<span className="mt-dots"><i>.</i><i>.</i><i>.</i></span>
        </p>
        {message && <p className="mt-msg">{message}</p>}
        <div className="mt-bar"><span /></div>
        <a className="mt-admin" href="/api/auth/login">Вход для администратора</a>
      </div>
    </main>
  );
}
