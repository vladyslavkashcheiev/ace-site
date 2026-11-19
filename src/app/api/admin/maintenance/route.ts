import { NextResponse, type NextRequest } from "next/server";
import { apiActor, audit } from "@/lib/staff";
import { setMaintenance } from "@/lib/settings";

export async function POST(req: NextRequest) {
  const actor = await apiActor("admin");
  if (actor instanceof NextResponse) return actor;
  const b = (await req.json().catch(() => ({}))) as { on?: boolean; message?: string };
  const on = !!b.on;
  const message = String(b.message ?? "").trim().slice(0, 300);
  try {
    await setMaintenance(on, message, actor.name);
  } catch {
    return NextResponse.json({ error: "Ошибка базы: выполни supabase/stage4.sql в Supabase." }, { status: 500 });
  }
  await audit(actor, on ? "Включил техобслуживание" : "Выключил техобслуживание", null, message || undefined);
  return NextResponse.json({ ok: true });
}
