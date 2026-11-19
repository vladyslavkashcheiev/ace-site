import "server-only";
import { db } from "./db";

export type Maintenance = { on: boolean; message: string; by?: string | null; at?: string | null };

/** Режим техобслуживания. Если таблицы ещё нет или база недоступна — считаем выключенным. */
export async function getMaintenance(): Promise<Maintenance> {
  try {
    const { data, error } = await db().from("site_settings").select("value, updated_by_name, updated_at").eq("key", "maintenance").maybeSingle();
    if (error || !data) return { on: false, message: "" };
    const v = data.value as { on?: boolean; message?: string };
    return { on: !!v.on, message: v.message ?? "", by: data.updated_by_name, at: data.updated_at };
  } catch {
    return { on: false, message: "" };
  }
}

export async function setMaintenance(on: boolean, message: string, byName: string) {
  const { error } = await db().from("site_settings").upsert({
    key: "maintenance",
    value: { on, message },
    updated_by_name: byName,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

/** Для API: во время техобслуживания отправлять что-либо могут только администраторы. */
export async function maintenanceBlocked(access: string | undefined) {
  if (access === "admin") return false;
  return (await getMaintenance()).on;
}
