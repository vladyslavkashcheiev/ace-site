import { DiscordLogo } from "@/components/Icons";
import { getSession } from "@/lib/session";
import { ACCESS_LABEL } from "@/lib/access";

const ERRORS: Record<string, string> = {
  not_ace: "На сервере ACE у тебя нет роли подразделения (ACE [звание] или командной). Открыт только справочник и карта. Если ты в ACE — попроси командование выдать роль и войди снова.",
  state: "Вход прерван или устарел. Попробуй ещё раз.",
  discord: "Discord не ответил. Попробуй ещё раз через минуту.",
};

const LEVELS = [
  ["Гость", "Главная, справочник, законы, карта"],
  ["Боец ACE", "+ кабинет, отчёт на повышение, запись на переаттестацию"],
  ["Инструктор", "+ переаттестация, лекции, тренировки (этап 2)"],
  ["Зам / Командир / Куратор", "+ штаб: рейтинг, заявки, карточки бойцов (этап 2)"],
  ["Администратор", "+ админ-панель и выдача ролей (этап 2)"],
];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  const s = await getSession();
  const href = "/api/auth/login" + (next ? `?next=${encodeURIComponent(next)}` : "");
  return (
    <main className="container section" style={{ maxWidth: 1100 }}>
      {error && ERRORS[error] && <div className="err">{ERRORS[error]}</div>}
      <div className="panel pad split" style={{ padding: 40 }}>
        <div className="main stack">
          <span className="eyebrow">// Вход на портал</span>
          <h1 style={{ fontSize: 44, lineHeight: 1.05 }}>Войди через Discord</h1>
          <p className="lead">Паролей нет. Сайт узнаёт тебя по Discord и открывает то, что положено по твоей роли на сервере ACE.</p>
          {s && <p className="muted">Сейчас ты вошёл как {s.displayName} · {ACCESS_LABEL[s.access]}</p>}
          <div>
            <a className="btn discord" href={href}>
              <DiscordLogo size={24} />
              Войти через Discord
            </a>
          </div>
        </div>
        <div className="side stack" style={{ fontSize: 16, color: "var(--text-2)" }}>
          <span><b className="code">01</b> Никаких паролей — не забудешь и не угонят</span>
          <span><b className="code">02</b> Доступ по ролям Discord-сервера ACE</span>
          <span><b className="code">03</b> Сняли роль — доступ пропал сам</span>
          <span><b className="code">04</b> Сайт видит только ник, аватар и роли</span>
        </div>
      </div>
      <div className="tab-body">
        <div className="trow head" style={{ gridTemplateColumns: "minmax(200px,1fr) 2fr" }}><span>Кто</span><span>Что видит</span></div>
        {LEVELS.map(([w, t]) => (
          <div key={w} className="trow" style={{ gridTemplateColumns: "minmax(200px,1fr) 2fr" }}>
            <span className="code">{w}</span><span style={{ color: "var(--text-2)" }}>{t}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
