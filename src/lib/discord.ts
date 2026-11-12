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

/** Отправить сообщение в канал от имени бота. Пингуются только перечисленные роли. */
export async function postToChannel(channelId: string, content: string, pingRoles: string[] = []) {
  const res = await fetch(`${API}/channels/${channelId}/messages`, {
    method: "POST",
    headers: botHeaders(),
    body: JSON.stringify({
      content: content.slice(0, 2000),
      allowed_mentions: { parse: [], roles: pingRoles },
    }),
  });
  if (!res.ok) throw new Error(`Discord post: ${res.status} ${await res.text()}`);
  return (await res.json()) as { id: string };
}

export function avatarUrl(id: string, avatar: string | null) {
  if (!avatar) return `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(id) >> 22n) % 6}.png`;
  return `https://cdn.discordapp.com/avatars/${id}/${avatar}.png?size=64`;
}
