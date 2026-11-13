import { NextResponse, type NextRequest } from "next/server";
import { apiActor, audit, setRankRole } from "@/lib/staff";
import { addRole, fetchMemberRoles, removeRole } from "@/lib/discord";
import { db, getProfile } from "@/lib/db";
import { ACE_MEMBER_ROLE, ADMIN_USER_ID, RANK_ROLES, STAFF_ROLES } from "@/config/discord";
import { rankName } from "@/lib/ranks";

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
const STAFF_LABEL: Record<string, string> = { instructor: "Inst.ACE", deputy: "D.Com.ACE", commander: "Com.ACE", curator: "Cur.ACE" };

export async function POST(req: NextRequest) {
  const actor = await apiActor("admin");
  if (actor instanceof NextResponse) return actor;

  const b = (await req.json().catch(() => ({}))) as { userId?: string; op?: string; value?: string; reason?: string };
  const userId = String(b.userId ?? "").trim();
  if (!/^\d{15,21}$/.test(userId)) return fail("Неверный Discord ID.");
  const reason = String(b.reason ?? "").trim().slice(0, 200);

  // Администраторы сайта — управляет только владелец
  if (b.op === "addAdmin" || b.op === "removeAdmin") {
    if (actor.id !== ADMIN_USER_ID) return fail("Назначать администраторов может только владелец сайта.", 403);
    if (userId === ADMIN_USER_ID) return fail("Владелец всегда администратор.");
    const m0 = await fetchMemberRoles(userId).catch(() => null);
    const p0 = await getProfile(userId).catch(() => null);
    const nm = p0?.ic_name ?? m0?.nick ?? userId;
    if (b.op === "addAdmin") {
      const { error } = await db().from("site_admins").upsert({ discord_id: userId, name: nm, added_by: actor.id, added_by_name: actor.name });
      if (error) return fail("Ошибка базы: выполни supabase/stage3.sql.", 500);
      await audit(actor, "Назначил администратора сайта", { id: userId, name: nm }, reason || undefined);
    } else {
      await db().from("site_admins").delete().eq("discord_id", userId);
      await audit(actor, "Снял администратора сайта", { id: userId, name: nm }, reason || undefined);
    }
    return NextResponse.json({ ok: true });
  }

  // Сброс КД 48 ч на отчёт
  if (b.op === "resetCooldown") {
    const p0 = await getProfile(userId).catch(() => null);
    if (!p0) return fail("Боец ещё не заходил на сайт — КД у него нет.");
    const { error } = await db().from("profiles").update({ cooldown_reset_at: new Date().toISOString() }).eq("discord_id", userId);
    if (error) return fail("Ошибка базы: выполни supabase/stage3.sql.", 500);
    await audit(actor, "Сбросил КД (отчёт и аттестация)", { id: userId, name: p0.ic_name }, reason || undefined);
    return NextResponse.json({ ok: true });
  }

  const member = await fetchMemberRoles(userId);
  if (!member) return fail("Этого человека нет на сервере.");
  const profile = await getProfile(userId).catch(() => null);
  const target = { id: userId, name: profile?.ic_name ?? member.nick ?? userId };
  const why = (t: string) => `${t} — ${actor.name} через портал${reason ? `: ${reason}` : ""}`;

  try {
    switch (b.op) {
      case "setRank": {
        const num = Number(b.value);
        if (!RANK_ROLES.some((r) => r.num === num)) return fail("Неизвестное звание.");
        await setRankRole(userId, member.roles, num, why("Смена звания"));
        await audit(actor, "Сменил звание", target, `→ ${rankName(num)}${reason ? ` · ${reason}` : ""}`);
        break;
      }
      case "toggleStaff": {
        const key = String(b.value) as keyof typeof STAFF_ROLES;
        const roleId = STAFF_ROLES[key];
        if (!roleId) return fail("Неизвестная роль.");
        const has = member.roles.includes(roleId);
        if (has) await removeRole(userId, roleId, why(`Снятие ${STAFF_LABEL[key]}`));
        else await addRole(userId, roleId, why(`Выдача ${STAFF_LABEL[key]}`));
        await audit(actor, has ? `Снял роль ${STAFF_LABEL[key]}` : `Выдал роль ${STAFF_LABEL[key]}`, target, reason || undefined);
        break;
      }
      case "add": {
        if (ACE_MEMBER_ROLE) await addRole(userId, ACE_MEMBER_ROLE, why("Приём в ACE"));
        await setRankRole(userId, member.roles, 3, why("Приём в ACE"));
        await audit(actor, "Принял в ACE", target, `Специалист${reason ? ` · ${reason}` : ""}`);
        break;
      }
      case "dismiss": {
        if (userId === ADMIN_USER_ID) return fail("Администратора уволить нельзя.");
        if (!reason) return fail("Укажи причину увольнения.");
        const all = [...RANK_ROLES.map((r) => r.id), ...Object.values(STAFF_ROLES), ACE_MEMBER_ROLE].filter(Boolean);
        for (const id of all) if (member.roles.includes(id)) await removeRole(userId, id, why("Увольнение из ACE"));
        await audit(actor, "Уволил из ACE", target, reason);
        break;
      }
      default:
        return fail("Неизвестное действие.");
    }
  } catch (e) {
    return fail(`Discord не дал изменить роли: ${(e as Error).message.slice(0, 160)}. Проверь, что роль бота «ACE Портал» выше ролей ACE.`, 502);
  }
  return NextResponse.json({ ok: true });
}
