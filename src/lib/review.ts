import "server-only";
import { audit, rankRoleFor, setRankRole, type Actor } from "./staff";
import { db } from "./db";
import { fetchMemberRoles, finalizeMessage, publish, replyTo } from "./discord";
import { resolveAccess } from "./access";
import { rankName } from "./ranks";
import { CHANNELS } from "@/config/discord";

export type ReviewResult = { ok: true; info: string } | { ok: false; error: string };

export async function reviewReport(actor: Actor, id: number, action: string, noteIn?: string): Promise<ReviewResult> {
  const note = String(noteIn ?? "").trim().slice(0, 300);
  if (action !== "approve" && action !== "reject") return { ok: false, error: "Неизвестное действие." };
  if (action === "reject" && !note) return { ok: false, error: "Укажи причину отказа." };

  const { data: r, error } = await db().from("promotion_reports").select("*, profiles(ic_name)").eq("id", id).maybeSingle();
  if (error || !r) return { ok: false, error: "Отчёт не найден." };
  if (r.status !== "pending") return { ok: false, error: `Отчёт уже рассмотрен (${r.status === "approved" ? "одобрен" : "отклонён"}${r.reviewed_by_name ? `, ${r.reviewed_by_name}` : ""}).` };
  if (r.discord_id === actor.id && actor.access !== "admin") return { ok: false, error: "Свой отчёт рассматривает другой член командования." };

  const name = (r.profiles as { ic_name: string } | null)?.ic_name ?? r.discord_id;
  let info = "Отклонено.";

  if (action === "approve") {
    const member = await fetchMemberRoles(r.discord_id);
    if (!member) return { ok: false, error: "Боец больше не на сервере." };
    const { rankNum } = resolveAccess(r.discord_id, member.roles);
    const hasRankRole = !!rankRoleFor(r.from_rank) && member.roles.includes(rankRoleFor(r.from_rank)!.id);
    if (!hasRankRole && rankNum !== r.from_rank) return { ok: false, error: `Звание бойца уже изменилось (сейчас ${rankNum ?? "—"}). Отклони отчёт или попроси подать заново.` };
    if (rankRoleFor(r.to_rank)) {
      try {
        await setRankRole(r.discord_id, member.roles, r.to_rank, `Повышение одобрил ${actor.name}`);
        info = `Роль «${rankName(r.to_rank)}» выдана автоматически.`;
      } catch (e) {
        return { ok: false, error: `Не удалось сменить роль: ${(e as Error).message.slice(0, 150)}. Проверь, что роль бота выше ролей званий.` };
      }
    } else {
      info = `Роли для «${rankName(r.to_rank)}» в Discord нет — выдай вручную.`;
    }
  }

  const status = action === "approve" ? "approved" : "rejected";
  await db().from("promotion_reports").update({
    status,
    reviewed_by: actor.id,
    reviewed_by_name: actor.name,
    reviewed_at: new Date().toISOString(),
    review_note: note || null,
  }).eq("id", r.id);

  const line =
    status === "approved"
      ? `✅ **Одобрено** · ${actor.name} · ${r.from_rank}->${r.to_rank} (${rankName(r.to_rank)})${note ? ` · ${note}` : ""}`
      : `❌ **Отклонено** · ${actor.name} · Причина: ${note}`;
  await finalizeMessage(CHANNELS.promotionReports, r.discord_message_id, line).catch((e) => console.error(e));
  await replyTo(CHANNELS.promotionReports, r.discord_message_id, `<@${r.discord_id}> ${line}`, [r.discord_id]).catch((e) => console.error(e));

  await audit(actor, status === "approved" ? "Одобрил повышение" : "Отклонил отчёт", { id: r.discord_id, name }, `${r.from_rank}→${r.to_rank}, ${r.points} б.${note ? ` · ${note}` : ""}`);
  return { ok: true, info };
}

const EXAM_STEPS: Record<string, { from: string[]; to: string; label: string }> = {
  accept: { from: ["pending"], to: "accepted", label: "Подтвердил запись на аттестацию" },
  reject: { from: ["pending", "accepted"], to: "rejected", label: "Отклонил заявку на аттестацию" },
  pass: { from: ["accepted"], to: "passed", label: "Принял аттестацию: сдал" },
  fail: { from: ["accepted"], to: "failed", label: "Принял аттестацию: не сдал" },
};

export async function reviewExam(actor: Actor, id: number, action: string, noteIn?: string): Promise<ReviewResult> {
  const step = EXAM_STEPS[action];
  if (!step) return { ok: false, error: "Неизвестное действие." };
  const note = String(noteIn ?? "").trim().slice(0, 300);
  if (action === "reject" && !note) return { ok: false, error: "Укажи причину." };

  const { data: e, error } = await db().from("exam_requests").select("*, profiles(ic_name, passport)").eq("id", id).maybeSingle();
  if (error || !e) return { ok: false, error: "Заявка не найдена." };
  if (!step.from.includes(e.status)) return { ok: false, error: "Статус заявки уже изменился." };
  if (e.discord_id === actor.id && actor.access !== "admin") return { ok: false, error: "Свою заявку принимает другой инструктор." };

  const p = e.profiles as { ic_name: string; passport: string } | null;
  await db().from("exam_requests").update({
    status: step.to,
    reviewed_by: actor.id,
    reviewed_by_name: actor.name,
    reviewed_at: new Date().toISOString(),
    review_note: note || null,
  }).eq("id", e.id);

  const line = {
    accepted: `🗓️ **Запись подтверждена** · экзаменатор ${actor.name}${note ? ` · ${note}` : ""}`,
    rejected: `❌ **Отклонено** · ${actor.name} · ${note}`,
    passed: `✅ **Сдал** · экзаменатор ${actor.name}${note ? ` · ${note}` : ""}`,
    failed: `❌ **Не сдал** · экзаменатор ${actor.name}${note ? ` · ${note}` : ""}`,
  }[step.to]!;

  // после «подтвердить» кнопки меняются на «Сдал / Не сдал», после итога — убираются
  await finalizeMessage(CHANNELS.examSignup, e.discord_message_id, line, step.to === "accepted" ? examButtons(e.id, "accepted") : []).catch((x) => console.error(x));
  await replyTo(CHANNELS.examSignup, e.discord_message_id, `<@${e.discord_id}> ${line}`, [e.discord_id]).catch((x) => console.error(x));

  if (step.to === "passed" || step.to === "failed") {
    const t = [
      `**Отчёт экзаменации** · ${step.to === "passed" ? "✅ СДАЛ" : "❌ НЕ СДАЛ"}`,
      `Боец: <@${e.discord_id}> — ${p?.ic_name ?? ""} | ${p?.passport ?? ""}`,
      `Экзамен: ${e.exam}`,
      `Экзаменатор: ${actor.name}`,
      note ? `Комментарий: ${note}` : null,
    ].filter(Boolean).join("\n");
    await publish(CHANNELS.examResults, `${p?.ic_name ?? "Боец"} | ${e.exam} | ${step.to === "passed" ? "сдал" : "не сдал"}`, t).catch((x) => console.error(x));
  }

  await audit(actor, step.label, { id: e.discord_id, name: p?.ic_name ?? e.discord_id }, `${e.exam}${note ? ` · ${note}` : ""}`);
  return { ok: true, info: "Готово." };
}

/* ---------- Кнопки под сообщениями ---------- */
type Button = { type: 2; style: number; label: string; custom_id: string; emoji?: { name: string } };
const row = (...b: Button[]) => [{ type: 1, components: b }];

export const reportButtons = (id: number) =>
  row(
    { type: 2, style: 3, label: "Одобрить", emoji: { name: "✅" }, custom_id: `rep:approve:${id}` },
    { type: 2, style: 4, label: "Отклонить", emoji: { name: "❌" }, custom_id: `rep:reject:${id}` },
  );

export function examButtons(id: number, stage: "pending" | "accepted") {
  return stage === "pending"
    ? row(
        { type: 2, style: 3, label: "Подтвердить запись", emoji: { name: "🗓️" }, custom_id: `exam:accept:${id}` },
        { type: 2, style: 4, label: "Отклонить", emoji: { name: "❌" }, custom_id: `exam:reject:${id}` },
      )
    : row(
        { type: 2, style: 3, label: "Сдал", emoji: { name: "✅" }, custom_id: `exam:pass:${id}` },
        { type: 2, style: 4, label: "Не сдал", emoji: { name: "❌" }, custom_id: `exam:fail:${id}` },
        { type: 2, style: 2, label: "Отменить", custom_id: `exam:reject:${id}` },
      );
}
