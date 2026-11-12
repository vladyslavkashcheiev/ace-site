import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** Серверный клиент базы. Ключ service role никогда не попадает в браузер. */
export function db() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY не заданы");
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export type Profile = { discord_id: string; username: string; ic_name: string; passport: string };

export async function getProfile(discordId: string): Promise<Profile | null> {
  const { data, error } = await db().from("profiles").select("discord_id, username, ic_name, passport").eq("discord_id", discordId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertProfile(p: Profile) {
  const { error } = await db().from("profiles").upsert({ ...p, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export type ReportRow = { id: number; from_rank: number; to_rank: number; points: number; status: string; created_at: string };

export async function lastReports(discordId: string, limit = 10): Promise<ReportRow[]> {
  const { data, error } = await db()
    .from("promotion_reports")
    .select("id, from_rank, to_rank, points, status, created_at")
    .eq("discord_id", discordId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export type ExamRow = { id: number; exam: string; preferred_time: string; status: string; created_at: string };

export async function lastExamRequests(discordId: string, limit = 10): Promise<ExamRow[]> {
  const { data, error } = await db()
    .from("exam_requests")
    .select("id, exam, preferred_time, status, created_at")
    .eq("discord_id", discordId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
