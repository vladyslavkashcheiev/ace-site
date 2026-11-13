import { CLIENT_ID, GUILD_ID } from "@/config/discord";

const API = "https://discord.com/api/v10";

export function siteUrl() {
  const url = process.env.SITE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return url.replace(/\/$/, "");
}

export const redirectUri = () => `${siteUrl()}/api/auth/callback`;

export function authorizeUrl(state: string) {
  const p = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri(),
    scope: "identify",
    state,
  });
  return `https://discord.com/oauth2/authorize?${p}`;
}

export async function exchangeCode(code: string): Promise<string> {
  const secret = process.env.DISCORD_CLIENT_SECRET;
  if (!secret) throw new Error("DISCORD_CLIENT_SECRET не задан");
  const res = await fetch(`${API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: secret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(),
    }),
  });
  if (!res.ok) throw new Error(`Discord token: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export type DiscordUser = { id: string; username: string; global_name: string | null; avatar: string | null };

export async function fetchMe(accessToken: string): Promise<DiscordUser> {
  const res = await fetch(`${API}/users/@me`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Discord /users/@me: ${res.status}`);
  return res.json();
}

function botHeaders() {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error("DISCORD_BOT_TOKEN не задан");
  return { Authorization: `Bot ${token}`, "Content-Type": "application/json" };
}

/** Роли участника на сервере ACE. null — человека нет на сервере. */
export async function fetchMemberRoles(userId: string): Promise<{ roles: string[]; nick: string | null } | null> {
  const res = await fetch(`${API}/guilds/${GUILD_ID}/members/${userId}`, { headers: botHeaders(), cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Discord member: ${res.status} ${await res.text()}`);
  const m = (await res.json()) as { roles: string[]; nick: string | null };
  return { roles: m.roles, nick: m.nick };
}

/** Все роли сервера: id → название (для диагностики). */
export async function fetchGuildRoleNames(): Promise<Record<string, string>> {
  const res = await fetch(`${API}/guilds/${GUILD_ID}/roles`, { headers: botHeaders(), next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Discord roles: ${res.status}`);
  const list = (await res.json()) as { id: string; name: string }[];
  return Object.fromEntries(list.map((r) => [r.id, r.name]));
}

/** Отправить сообщение в канал от имени бота. Пингуются только перечисленные роли/люди. */
export async function postToChannel(
  channelId: string,
  content: string,
  pingRoles: string[] = [],
  opts: { replyTo?: string | null; pingUsers?: string[] } = {},
) {
  const res = await fetch(`${API}/channels/${channelId}/messages`, {
    method: "POST",
    headers: botHeaders(),
    body: JSON.stringify({
      content: content.slice(0, 2000),
      allowed_mentions: { parse: [], roles: pingRoles, users: opts.pingUsers ?? [], replied_user: false },
      ...(opts.replyTo ? { message_reference: { message_id: opts.replyTo, fail_if_not_exists: false } } : {}),
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    if (res.status === 403 || res.status === 404)
      throw new Error(`NO_CHANNEL_ACCESS:${channelId}:${t.slice(0, 120)}`);
    throw new Error(`Discord post: ${res.status} ${t}`);
  }
  return (await res.json()) as { id: string };
}

const channelTypes = new Map<string, number>();
async function channelType(channelId: string): Promise<number> {
  const cached = channelTypes.get(channelId);
  if (cached !== undefined) return cached;
  const res = await fetch(`${API}/channels/${channelId}`, { headers: botHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(`NO_CHANNEL_ACCESS:${channelId}:${res.status}`);
  const t = ((await res.json()) as { type: number }).type;
  channelTypes.set(channelId, t);
  return t;
}

/**
 * Публикует в канал. Если канал — форум (как «отчет-на-повышение»), создаёт отдельную ветку с заголовком.
 * Возвращает ссылку для ответов: "thread:<id>" для ветки или id сообщения для обычного канала.
 */
export async function publish(channelId: string, title: string, content: string, pingRoles: string[] = []): Promise<string> {
  const type = await channelType(channelId);
  if (type === 15 || type === 16) {
    const res = await fetch(`${API}/channels/${channelId}/threads`, {
      method: "POST",
      headers: botHeaders(),
      body: JSON.stringify({
        name: title.slice(0, 100),
        message: { content: content.slice(0, 2000), allowed_mentions: { parse: [], roles: pingRoles } },
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      if (res.status === 403 || res.status === 404) throw new Error(`NO_CHANNEL_ACCESS:${channelId}:${t.slice(0, 120)}`);
      throw new Error(`Discord forum post: ${res.status} ${t}`);
    }
    return `thread:${((await res.json()) as { id: string }).id}`;
  }
  return (await postToChannel(channelId, content, pingRoles)).id;
}

/** Ответ на публикацию: в ветку форума или реплаем на сообщение в обычном канале. */
export async function replyTo(channelId: string, ref: string | null, content: string, pingUsers: string[] = []) {
  if (ref?.startsWith("thread:")) return postToChannel(ref.slice(7), content, [], { pingUsers });
  return postToChannel(channelId, content, [], { replyTo: ref, pingUsers });
}

/** Человекочитаемая причина, почему бот не смог написать в канал. */
export function postErrorText(e: unknown, channelName: string) {
  const m = (e as Error)?.message ?? "";
  if (m.startsWith("NO_CHANNEL_ACCESS"))
    return `Бот не может писать в канал ${channelName}. В настройках канала → Права доступа добавь роль «ACE Портал» и разреши: Просматривать канал, Отправлять сообщения, Отправлять сообщения в ветках, Создавать публичные ветки, Упоминать все роли.`;
  if (m.includes("BOT_TOKEN")) return "На сайте не настроен токен бота (DISCORD_BOT_TOKEN).";
  return "Не удалось отправить в Discord. Попробуй позже.";
}

export type GuildMember = { id: string; username: string; globalName: string | null; nick: string | null; avatar: string | null; roles: string[] };

/** Все участники сервера (нужен Server Members Intent у бота). */
export async function listGuildMembers(): Promise<GuildMember[]> {
  const out: GuildMember[] = [];
  let after = "0";
  for (let page = 0; page < 20; page++) {
    const res = await fetch(`${API}/guilds/${GUILD_ID}/members?limit=1000&after=${after}`, { headers: botHeaders(), cache: "no-store" });
    if (!res.ok) throw new Error(`Discord members: ${res.status} ${await res.text()}`);
    const batch = (await res.json()) as {
      user: { id: string; username: string; global_name: string | null; avatar: string | null; bot?: boolean };
      nick: string | null;
      roles: string[];
    }[];
    for (const m of batch) {
      if (m.user.bot) continue;
      out.push({ id: m.user.id, username: m.user.username, globalName: m.user.global_name, nick: m.nick, avatar: m.user.avatar, roles: m.roles });
    }
    if (batch.length < 1000) break;
    after = batch[batch.length - 1].user.id;
  }
  return out;
}

async function roleRequest(method: "PUT" | "DELETE", userId: string, roleId: string, reason: string) {
  const res = await fetch(`${API}/guilds/${GUILD_ID}/members/${userId}/roles/${roleId}`, {
    method,
    headers: { ...botHeaders(), "X-Audit-Log-Reason": encodeURIComponent(reason.slice(0, 400)) },
  });
  if (!res.ok && res.status !== 404) throw new Error(`Discord role ${method}: ${res.status} ${await res.text()}`);
}
export const addRole = (userId: string, roleId: string, reason: string) => roleRequest("PUT", userId, roleId, reason);
export const removeRole = (userId: string, roleId: string, reason: string) => roleRequest("DELETE", userId, roleId, reason);

export function avatarUrl(id: string, avatar: string | null) {
  if (!avatar) return `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(id) >> 22n) % 6}.png`;
  return `https://cdn.discordapp.com/avatars/${id}/${avatar}.png?size=64`;
}
