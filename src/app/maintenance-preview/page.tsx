import { redirect } from "next/navigation";
import Maintenance from "@/components/Maintenance";
import { getSession } from "@/lib/session";
import { getMaintenance } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** Предпросмотр заглушки для администратора (рисуется поверх обычной шапки). */
export default async function Preview() {
  const s = await getSession();
  if (s?.access !== "admin") redirect("/");
  const m = await getMaintenance();
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "var(--bg)", overflow: "auto" }}>
      <Maintenance message={m.message || "Так будет выглядеть заглушка для всех, кроме администраторов."} />
    </div>
  );
}
