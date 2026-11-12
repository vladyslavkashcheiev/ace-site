import { requireAce } from "@/lib/guard";
import ExamForm from "./ExamForm";

export const metadata = { title: "Переаттестация — ACE" };

export default async function ExamPage() {
  const s = await requireAce("/exam");
  return (
    <main className="container section">
      <div className="stack" style={{ gap: 10 }}>
        <span className="eyebrow">// Переаттестация</span>
        <h1 style={{ fontSize: 48, lineHeight: 1.05 }}>Запись на аттестацию</h1>
        <p className="lead">Нужна для повышения с 7 ранга и выше. Выбери экзамен и время — заявка уйдёт инструкторам в Discord.</p>
      </div>
      <ExamForm name={s.icName!} passport={s.passport!} />
    </main>
  );
}
