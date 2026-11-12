import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import OnboardingForm from "./OnboardingForm";

export default async function Onboarding({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.access === "guest") redirect("/login?error=not_ace");
  const { next = "/profile" } = await searchParams;
  return (
    <main className="container section" style={{ maxWidth: 760 }}>
      <div className="panel pad stack" style={{ padding: 40 }}>
        <span className="eyebrow">// {s.icName ? "Изменить анкету" : "Только при первом входе"}</span>
        <h1 style={{ fontSize: 32 }}>Привет, @{s.username}! Кто ты в игре?</h1>
        <p className="lead">Заполняется один раз — дальше имя и паспорт подставятся в отчёты и заявки сами.</p>
        <OnboardingForm next={next} icName={s.icName ?? ""} passport={s.passport ?? ""} />
      </div>
    </main>
  );
}
