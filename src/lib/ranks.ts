export const ARMY_RANKS = [
  "Рекрут",
  "Рядовой",
  "Специалист",
  "Капрал",
  "Сержант",
  "Штаб-сержант",
  "Уорент-офицер",
  "Старший уорент-офицер",
  "Лейтенант",
  "Капитан",
  "Майор",
  "Подполковник",
  "Полковник",
  "Генерал-майор",
  "Генерал-лейтенант",
  "Генерал армии",
];

export const rankName = (num: number) => ARMY_RANKS[num - 1] ?? `Ранг ${num}`;

/** Порядок повышения ACE: что нужно, чтобы перейти с ранга num на num+1. */
export type Requirement = { points: number; ovz?: boolean; exam?: string; byCommand?: boolean };

export function requirementFrom(num: number): Requirement {
  if (num <= 3) return { points: 0, ovz: true };
  const table: Record<number, Requirement> = {
    4: { points: 50 },
    5: { points: 70 },
    6: { points: 90 },
    7: { points: 110, exam: "вопросы (7/2)" },
    8: { points: 130, exam: "вопросы (10/3) + вождение барака" },
    9: { points: 150, exam: "вопросы (15/4) + вождение барака" },
    10: { points: 170, exam: "вопросы (15/4) + вождение барака" },
  };
  return table[num] ?? { points: 0, byCommand: true };
}

/** Система начисления баллов. */
export const ACTIVITIES = [
  { id: "training", label: "Тренировка / с другими подразделениями", points: 10 },
  { id: "lecture", label: "Лекция", points: 5 },
  { id: "drop", label: "Дроп / Поезд / ЧР", points: 10 },
  { id: "supply", label: "Поставка материалов / аптечек", points: 15 },
  { id: "fz", label: "Отбитие ФЗ / ФТ", points: 15 },
  { id: "analgetic", label: "Отбитие Анальгетики", points: 15 },
  { id: "formation", label: "Вечернее построение", points: 15 },
] as const;

export type ActivityId = (typeof ACTIVITIES)[number]["id"];

export function sumPoints(counts: Partial<Record<string, number>>) {
  let total = 0;
  for (const a of ACTIVITIES) {
    const c = Math.max(0, Math.min(99, Math.floor(Number(counts[a.id] ?? 0)) || 0));
    total += c * a.points;
  }
  return total;
}

export const EXAMS = [
  { id: "re7", label: "Переаттестация 7 → 8", desc: "7 вопросов, до 2 ошибок" },
  { id: "re8", label: "Переаттестация 8 → 9", desc: "10 вопросов, до 3 ошибок + вождение барака" },
  { id: "re9", label: "Переаттестация 9 → 10 / 10 → 11", desc: "15 вопросов, до 4 ошибок + вождение барака" },
  { id: "drive", label: "Вождение барака", desc: "Практическая часть на HVY Barracks" },
] as const;
