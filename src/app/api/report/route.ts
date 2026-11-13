import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { fetchMemberRoles, postErrorText, postToChannel } from "@/lib/discord";
import { resolveAccess } from "@/lib/access";
import { db, getProfile } from "@/lib/db";
import { ACTIVITIES, requirementFrom, sumPoints } from "@/lib/ranks";
import { CHANNELS, PROMOTION_MENTIONS } from "@/config/discord";

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return fail("Сначала войди через Discord.", 401);

  let body: { counts?: Record<string, number>; proof?: string; checks?: boolean[] };
  try {
    body = await req.json();
  } catch {
    return fail("Неверный запрос.");
  }

  // Роли проверяем заново — вдруг роль сняли или повысили после входа.
  const member = await fetchMemberRoles(s.id).catch(() => null);
  const { access, rankNum } = resolveAccess(s.id, member?.roles ?? null);
  if (access === "guest") return fail("У тебя нет роли ACE на сервере.", 403);
  if (!rankNum) return fail("Не найдена роль звания ACE в Discord. Попроси командование выдать её.", 403);

  const profile = await getProfile(s.id);
  if (!profile) return fail("Заполни анкету (имя и паспорт).", 403);

  const req2 = requirementFrom(rankNum);
  if (req2.byCommand) return fail("С этого звания повышение — по решению руководства, отчёт не нужен.");

  const counts = body.counts ?? {};
  const total = sumPoints(counts);
  if (total < req2.points) return fail(`Не хватает ${req2.points - total} баллов.`);

  const proof = String(body.proof ?? "").trim().slice(0, 1200);
  if (!/https?:\/\//.test(proof)) return fail("Добавь хотя бы одну ссылку на доказательства.");
  if (!Array.isArray(body.checks) || body.checks.length !== 5 || !body.checks.every(Boolean)) return fail("Отметь все пункты чек-листа.");

  // КД 48 часов между отчётами.
  const since = new Date(Date.now() - 48 * 3600e3).toISOString();
  const { data: recent, error: recentErr } = await db()
    .from("promotion_reports")
    .select("created_at")
    .eq("discord_id", s.id)
    .gte("created_at", since)
    .neq("status", "rejected")
    .order("created_at", { ascending: false })
    .limit(1);
  if (recentErr) return fail("Ошибка базы, попробуй ещё раз.", 500);
  if (recent && recent.length) {
    const left = Math.ceil((new Date(recent[0].created_at).getTime() + 48 * 3600e3 - Date.now()) / 3600e3);
    return fail(`Повышение — 1 раз в 48 часов. Следующий отчёт можно подать через ${left} ч.`, 429);
  }

  const breakdown: Record<string, number> = {};
  const parts: string[] = [];
  for (const a of ACTIVITIES) {
    const c = Math.max(0, Math.min(99, Math.floor(Number(counts[a.id] ?? 0)) || 0));
    if (c) {
      breakdown[a.id] = c;
      parts.push(`${a.label} ×${c}`);
    }
  }

  const content = [
    `**Отчёт на повышение** · <@${s.id}>`,
    `1.ФИО и номер паспорта: ${profile.ic_name} | ${profile.passport}`,
    `2.Текущий и целевой ранг: ${rankNum}->${rankNum + 1}`,
    `3.Сумма баллов: ${total}${parts.length ? ` (${parts.join(", ")})` : ""}`,
    `4.Ссылка на доказательства + подпись:\n${proof}`,
    `5.${PROMOTION_MENTIONS.map((r) => `<@&${r}>`).join(" ")}`,
  ].join("\n");

  let messageId: string | null = null;
  try {
    messageId = (await postToChannel(CHANNELS.promotionReports, content, PROMOTION_MENTIONS)).id;
  } catch (e) {
    console.error(e);
    return fail(postErrorText(e, "🗃️-отчет-на-повышение"), 502);
  }

  const { error } = await db().from("promotion_reports").insert({
    discord_id: s.id,
    from_rank: rankNum,
    to_rank: rankNum + 1,
    points: total,
    breakdown,
    proof,
    discord_message_id: messageId,
  });
  if (error) console.error("report insert failed", error);

  return NextResponse.json({ ok: true, from: rankNum, to: rankNum + 1, total });
}
