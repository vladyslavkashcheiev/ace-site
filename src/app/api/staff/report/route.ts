import { NextResponse, type NextRequest } from "next/server";
import { apiActor } from "@/lib/staff";
import { reviewReport } from "@/lib/review";

export async function POST(req: NextRequest) {
  const actor = await apiActor("deputy");
  if (actor instanceof NextResponse) return actor;
  const b = (await req.json().catch(() => ({}))) as { id?: number; action?: string; note?: string };
  const r = await reviewReport(actor, Number(b.id), String(b.action), b.note);
  return r.ok ? NextResponse.json({ ok: true, roleNote: r.info }) : NextResponse.json({ error: r.error }, { status: 400 });
}
