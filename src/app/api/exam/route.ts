import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { fetchMemberRoles, postErrorText, publish } from "@/lib/discord";
import { resolveAccess } from "@/lib/access";
import { db, getProfile } from "@/lib/db";
import { EXAMS, rankName } from "@/lib/ranks";
import { CHANNELS, STAFF_ROLES } from "@/config/discord";

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return fail("Сначала войди через Discord.", 401);

  let body: { exam?: string; time?: string; comment?: string };
  try {
    body = await req.json();
  } catch {
    return fail("Неверный запрос.");
  }

  const member = await fetchMemberRoles(s.id).catch(() => null);
  const { access, rankNum } = resolveAccess(s.id, member?.roles ?? null);
  if (access === "guest") return fail("У тебя нет роли ACE на сервере.", 403);

  const profile = await getProfile(s.id);
  if (!profile) return fail("Заполни анкету (имя и паспорт).", 403);

  const exam = EXAMS.find((e) => e.id === body.exam);
  if (!exam) return fail("Выбери экзамен.");
  const time = String(body.time ?? "").trim().slice(0, 80);
  if (!time) return fail("Укажи удобное время.");
  const comment = String(body.comment ?? "").trim().slice(0, 300);

  const since = new Date(Date.now() - 3600e3).toISOString();
  const { data: recent } = await db().from("exam_requests").select("id").eq("discord_id", s.id).gte("created_at", since).limit(1);
  if (recent && recent.length) return fail("Ты уже подавал заявку в течение часа. Дождись ответа инструктора.", 429);

  // Формат как в канале: 1) ник 2) с какого на какой порядковый 3) время + отметка инструкторов
  const content = [
    `1) Ваш ник: ${profile.ic_name}`,
    `2) с какого на какой порядковый: ${rankNum ? `${rankNum}-${rankNum + 1}` : "—"}`,
    `3) время прохождения аттестации: ${time}`,
    exam.id === "drive" ? `Экзамен: ${exam.label}` : null,
    comment ? `Комментарий: ${comment}` : null,
    `<@&${STAFF_ROLES.instructor}>`,
    `-# заявка с сайта · <@${s.id}> · паспорт ${profile.passport}`,
  ]
    .filter(Boolean)
    .join("\n");

  let messageId: string | null = null;
  try {
    messageId = await publish(CHANNELS.examSignup, `${profile.ic_name} | ${exam.label} | ${time}`, content, [STAFF_ROLES.instructor]);
  } catch (e) {
    console.error(e);
    return fail(postErrorText(e, "✉️┃заявка-на-аттестацию"), 502);
  }

  const { error } = await db().from("exam_requests").insert({
    discord_id: s.id,
    exam: exam.label,
    preferred_time: time,
    comment: comment || null,
    discord_message_id: messageId,
  });
  if (error) console.error("exam insert failed", error);

  return NextResponse.json({ ok: true });
}
