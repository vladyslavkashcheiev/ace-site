import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Access } from "./access";

export const SESSION_COOKIE = "ace_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 дней

export type Session = {
  id: string; // Discord ID
  username: string;
  displayName: string;
  avatar: string | null;
  access: Access;
  rankNum: number | null;
  icName: string | null;
  passport: string | null;
};

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET не задан или короче 32 символов");
  return new TextEncoder().encode(s);
}

export async function createSessionToken(session: Session) {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

export async function setSession(session: Session) {
  const token = await createSessionToken(session);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
