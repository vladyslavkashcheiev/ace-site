"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const PUBLIC = [
  { href: "/", label: "Главная" },
  { href: "/#guide", label: "Справочник" },
  { href: "/map", label: "Карта" },
];
const ACE = [
  { href: "/profile", label: "Кабинет" },
  { href: "/report", label: "Повышение" },
  { href: "/exam", label: "Экзамены" },
];

export default function NavLinks({ inAce }: { inAce: boolean }) {
  const path = usePathname();
  const items = inAce ? [PUBLIC[0], ACE[0], PUBLIC[1], PUBLIC[2], ACE[1], ACE[2]] : PUBLIC;
  return (
    <nav className="nav" aria-label="Основное меню">
      {items.map((i) => (
        <Link key={i.href} href={i.href} className={"navlink" + (path === i.href ? " on" : "")}>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
