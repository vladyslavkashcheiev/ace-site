import { NextResponse, type NextRequest } from "next/server";
import { apiActor, audit } from "@/lib/staff";
import { db } from "@/lib/db";
import { publish, replyTo } from "@/lib/discord";
import { CHANNELS } from "@/config/discord";

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
const NEXT: Record<string, { from: string[]; to: string; label: string }> = {
  accept: { from: ["pending"], to: "accepted", label: "Подтвердил запись на аттестацию" },
  reject: { from: ["pending", "accepted"], to: "rejected", label: "Отклонил заявку на аттестацию" },
  pass: { from: ["accepted"], to: "passed", label: "Принял аттестацию: сдал" },
  fail: { from: ["accepted"], to: "failed", label: "Принял аттестацию: не сдал" },
};

export async function POST(req: NextRequest) {
  const actor = await apiActor("instructor");
  if (actor instanceof NextResponse) return actor;

  const body = (await req.json().catch(() => ({}))) as { id?: number; action?: string; note?: string };
  const step = NEXT[body.action ?? ""];
  if (!step) return fail("Неизвестное действие.");
  const note = String(body.note ?? "").trim().slice(0, 300);
  if (body.action === "reject" && !note) return fail("Укажи причину.");

  const { data: e, error } = await db().from("exam_requests").select("*, profiles(ic_name, passport)").eq("id", body.id).maybeSingle();
  if (error || !e) return fail("Заявка не найдена.", 404);
  if (!step.from.includes(e.status)) return fail("Статус заявки уже изменился — обнови страницу.");
  if (e.discord_id === actor.id) return fail("Свою заявку принимает другой инструктор.");

  const p = e.profiles as { ic_name: string; passport: string } | null;
  await db().from("exam_requests").update({
    status: step.to,
    reviewed_by: actor.id,
    reviewed_by_name: actor.name,
    reviewed_at: new Date().toISOString(),
    review_note: note || null,
  }).eq("id", e.id);

  if (step.to === "accepted" || step.to === "rejected") {
    const t = step.to === "accepted"
      ? `🗓️ **Запись подтверждена** · <@${e.discord_id}> — ${e.exam}, ${e.preferred_time}. Экзаменатор: ${actor.name}${note ? `\n${note}` : ""}`
      : `❌ **Заявка отклонена** · <@${e.discord_id}> — ${e.exam}. ${actor.name}: ${note}`;
    await replyTo(CHANNELS.examSignup, e.discord_message_id, t, [e.discord_id]).catch((x) => console.error(x));
  } else {
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
  return NextResponse.json({ ok: true });
}
