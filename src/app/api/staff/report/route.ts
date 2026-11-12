import { NextResponse, type NextRequest } from "next/server";
import { apiActor, audit, rankRoleFor, setRankRole } from "@/lib/staff";
import { db } from "@/lib/db";
import { fetchMemberRoles, postToChannel } from "@/lib/discord";
import { resolveAccess } from "@/lib/access";
import { rankName } from "@/lib/ranks";
import { CHANNELS } from "@/config/discord";

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  const actor = await apiActor("deputy");
  if (actor instanceof NextResponse) return actor;

  const body = (await req.json().catch(() => ({}))) as { id?: number; action?: string; note?: string };
  const note = String(body.note ?? "").trim().slice(0, 300);
  if (body.action !== "approve" && body.action !== "reject") return fail("Неизвестное действие.");
  if (body.action === "reject" && !note) return fail("Укажи причину отказа.");

  const { data: r, error } = await db().from("promotion_reports").select("*, profiles(ic_name)").eq("id", body.id).maybeSingle();
  if (error || !r) return fail("Отчёт не найден.", 404);
  if (r.status !== "pending") return fail("Отчёт уже рассмотрен.");
  if (r.discord_id === actor.id) return fail("Свой отчёт рассматривает другой член командования.");

  const name = (r.profiles as { ic_name: string } | null)?.ic_name ?? r.discord_id;
  let roleNote = "";

  if (body.action === "approve") {
    const member = await fetchMemberRoles(r.discord_id);
    if (!member) return fail("Боец больше не на сервере.");
    const { rankNum } = resolveAccess(r.discord_id, member.roles);
    if (rankNum !== r.from_rank) return fail(`Звание бойца уже изменилось (сейчас ${rankNum ?? "—"}). Отклони отчёт или попроси подать заново.`);
    if (rankRoleFor(r.to_rank)) {
      try {
        await setRankRole(r.discord_id, member.roles, r.to_rank, `Повышение одобрил ${actor.name}`);
        roleNote = `Роль «${rankName(r.to_rank)}» выдана автоматически.`;
      } catch (e) {
        return fail(`Не удалось сменить роль: ${(e as Error).message}. Проверь, что роль бота выше ролей званий.`, 502);
      }
    } else {
      roleNote = `Роли для «${rankName(r.to_rank)}» в Discord нет — выдай вручную.`;
    }
  }

  const status = body.action === "approve" ? "approved" : "rejected";
  await db().from("promotion_reports").update({
    status,
    reviewed_by: actor.id,
    reviewed_by_name: actor.name,
    reviewed_at: new Date().toISOString(),
    review_note: note || null,
  }).eq("id", r.id);

  const text =
    status === "approved"
      ? `✅ **Одобрено** · <@${r.discord_id}> повышен: ${r.from_rank}->${r.to_rank} (${rankName(r.to_rank)}). Рассмотрел: ${actor.name}${note ? `\nКомментарий: ${note}` : ""}`
      : `❌ **Отклонено** · <@${r.discord_id}>, отчёт ${r.from_rank}->${r.to_rank}. Рассмотрел: ${actor.name}\nПричина: ${note}`;
  await postToChannel(CHANNELS.promotionReports, text, [], { replyTo: r.discord_message_id, pingUsers: [r.discord_id] }).catch((e) => console.error(e));

  await audit(actor, status === "approved" ? "Одобрил повышение" : "Отклонил отчёт", { id: r.discord_id, name }, `${r.from_rank}→${r.to_rank}, ${r.points} б.${note ? ` · ${note}` : ""}`);
  return NextResponse.json({ ok: true, roleNote });
}
