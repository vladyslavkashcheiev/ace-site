// Публичные идентификаторы Discord. Это НЕ секреты — секреты лежат только в переменных окружения.

export const GUILD_ID = "1491358095308361798";
export const CLIENT_ID = process.env.DISCORD_CLIENT_ID ?? "1570509111806791812";
export const ADMIN_USER_ID = "548009754698448897";

export const STAFF_ROLES = {
  curator: "1491389589158363147", // Cur.ACE
  commander: "1491389729285865593", // Com.ACE
  deputy: "1491389807245525082", // D.Com.ACE
  instructor: "1491389890322108578", // Inst.ACE [7-11]
} as const;

/** Общая роль «ACE» без звания. Пусто = не используется. */
export const ACE_MEMBER_ROLE: string = process.env.ACE_MEMBER_ROLE_ID ?? "";

/** Роли званий ACE. Порядок = старшинство. num — номер ранга в армии. */
export const RANK_ROLES: { num: number; rank: string; id: string }[] = [
  { num: 3, rank: "Специалист", id: "1513895125019787334" },
  { num: 4, rank: "Капрал", id: "1513895253331935355" },
  { num: 5, rank: "Сержант", id: "1513895385259839579" },
  { num: 6, rank: "Штаб-сержант", id: "1513895502620659867" },
  { num: 7, rank: "Уорент-офицер", id: "1513895618509148301" },
  { num: 8, rank: "Старший уорент-офицер", id: "1513895750516609224" },
  { num: 9, rank: "Лейтенант", id: "1513895905923829921" },
  { num: 11, rank: "Майор", id: "1513898608158839066" },
];

export const CHANNELS = {
  promotionReports: "1570709877448380487", // отчет-на-повышение (новый канал)
  examSignup: "1513291429470933072", // ✉️┃заявка-на-аттестацию
  examResults: "1516188389458837514", // 📒┃отчет-экзаменации
} as const;

/** Кого отмечать в отчёте на повышение. */
export const PROMOTION_MENTIONS = [STAFF_ROLES.curator, STAFF_ROLES.commander, STAFF_ROLES.deputy];
