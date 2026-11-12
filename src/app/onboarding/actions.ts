"use server";
import { redirect } from "next/navigation";
import { getSession, setSession } from "@/lib/session";
import { upsertProfile } from "@/lib/db";

export async function saveProfile(_: unknown, form: FormData): Promise<{ error?: string }> {
  const s = await getSession();
  if (!s || s.access === "guest") return { error: "Сначала войди через Discord." };
  const icName = String(form.get("icName") ?? "").trim().replace(/\s+/g, " ");
  const passport = String(form.get("passport") ?? "").trim();
  const next = String(form.get("next") ?? "/profile");
  if (!/^[A-Za-z]+ [A-Za-z]+$/.test(icName) || icName.length > 40) return { error: "Имя и фамилия латиницей через пробел, например: Sidni Preskot" };
  if (!/^\d{1,8}$/.test(passport)) return { error: "Номер паспорта — только цифры, например: 83284" };
  try {
    await upsertProfile({ discord_id: s.id, username: s.username, ic_name: icName, passport });
  } catch (e) {
    console.error(e);
    return { error: "Не удалось сохранить. Попробуй ещё раз." };
  }
  await setSession({ ...s, icName, passport });
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/profile");
}
