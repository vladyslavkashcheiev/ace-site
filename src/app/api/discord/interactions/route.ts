import { NextResponse, after, type NextRequest } from "next/server";
import { createPublicKey, verify } from "node:crypto";
import { CLIENT_ID, DISCORD_PUBLIC_KEY } from "@/config/discord";
import { atLeast } from "@/lib/access";
import { accessFor } from "@/lib/admins";
import { getProfile } from "@/lib/db";
import { reviewExam, reviewReport } from "@/lib/review";
import type { Actor } from "@/lib/staff";

export const runtime = "nodejs";

function verifySignature(body: string, sig: string | null, ts: string | null) {
  if (!sig || !ts) return false;
  try {
    const key = createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: Buffer.from(DISCORD_PUBLIC_KEY, "hex").toString("base64url") }, format: "jwk" });
    return verify(null, Buffer.from(ts + body), key, Buffer.from(sig, "hex"));
  } catch {
    return false;
  }
}

type Interaction = {
  type: number;
  token: string;
  data?: { custom_id?: string; components?: { components: { custom_id: string; value: string }[] }[] };
  member?: { roles: string[]; nick: string | null; user: { id: string; username: string; global_name: string | null } };
};

const ephemeral = (content: string) => NextResponse.json({ type: 4, data: { content, flags: 64 } });

async function followup(token: string, content: string) {
  await fetch(`https://discord.com/api/v10/webhooks/${CLIENT_ID}/${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, flags: 64 }),
  }).catch(() => {});
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  if (!verifySignature(body, req.headers.get("x-signature-ed25519"), req.headers.get("x-signature-timestamp")))
    return new NextResponse("invalid request signature", { status: 401 });

  const i = JSON.parse(body) as Interaction;
  if (i.type === 1) return NextResponse.json({ type: 1 }); // PING от Discord при сохранении адреса

  const m = i.member;
  if (!m) return ephemeral("Кнопки работают только на сервере ACE.");
  const custom = i.data?.custom_id ?? "";
  const [kind, action, idStr] = custom.split(":");
  const id = Number(idStr);
  if (!["rep", "exam", "repmodal", "exammodal"].includes(kind) || !id) return ephemeral("Неизвестная кнопка.");

  const { access } = await accessFor(m.user.id, m.roles);
  const isReport = kind.startsWith("rep");
  const need = isReport ? "deputy" : "instructor";
  if (!atLeast(access, need)) return ephemeral(isReport ? "Одобрять отчёты могут D.Com, Com, Cur." : "Принимать аттестации могут инструкторы и командование.");

  // Отказ — сначала спрашиваем причину во всплывающем окне
  if (i.type === 3 && action === "reject") {
    return NextResponse.json({
      type: 9,
      data: {
        custom_id: `${isReport ? "repmodal" : "exammodal"}:reject:${id}`,
        title: "Причина отказа",
        components: [{ type: 1, components: [{ type: 4, custom_id: "note", label: "Причина", style: 2, min_length: 2, max_length: 300, required: true }] }],
      },
    });
  }

  const note = i.type === 5 ? i.data?.components?.[0]?.components?.[0]?.value ?? "" : "";
  const profile = await getProfile(m.user.id).catch(() => null);
  const actor: Actor = { id: m.user.id, name: profile?.ic_name ?? m.nick ?? m.user.global_name ?? m.user.username, access };

  // Работа (смена ролей, база) может занять дольше 3 секунд — отвечаем сразу, делаем после.
  after(async () => {
    const r = isReport ? await reviewReport(actor, id, action, note) : await reviewExam(actor, id, action, note);
    await followup(i.token, r.ok ? `Готово. ${r.info}` : `⚠️ ${r.error}`);
  });
  return NextResponse.json({ type: 6 });
}
