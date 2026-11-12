import Link from "next/link";
import { getSession } from "@/lib/session";
import { avatarUrl } from "@/lib/discord";
import { DiscordLogo, Shield } from "./Icons";
import NavLinks from "./NavLinks";
import { atLeast } from "@/lib/access";

export default async function Header() {
  const s = await getSession();
  const inAce = !!s && s.access !== "guest";
  return (
    <header className="hdr">
      <div className="hdr-in">
        <Link href="/" className="logo">
          <Shield />
          <span>
            <b>ACE</b>
            <small>National Guard · Fort Zancudo</small>
          </span>
        </Link>
        <NavLinks inAce={inAce} staff={!!s && atLeast(s.access, "instructor")} admin={s?.access === "admin"} />
        {s ? (
          <div className="user">
            <Link href={inAce ? "/profile" : "/"} className="user-chip">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl(s.id, s.avatar)} alt="" />
              <span>{s.icName ?? s.displayName}</span>
            </Link>
            <form action="/api/auth/logout" method="post">
              <button className="logout" type="submit">Выйти</button>
            </form>
          </div>
        ) : (
          <a className="btn discord sm" href="/api/auth/login">
            <DiscordLogo size={18} />
            Войти через Discord
          </a>
        )}
      </div>
    </header>
  );
}
