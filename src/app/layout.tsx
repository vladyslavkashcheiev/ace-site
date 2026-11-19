import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Maintenance from "@/components/Maintenance";
import { getSession } from "@/lib/session";
import { getMaintenance } from "@/lib/settings";
import "./globals.css";

export const metadata: Metadata = {
  title: "ACE — Army Compartmented Elements",
  description: "Портал подразделения ACE: справочник, отчёты на повышение, переаттестация.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [maint, s] = await Promise.all([getMaintenance(), getSession()]);
  const isAdmin = s?.access === "admin";
  const closed = maint.on && !isAdmin;

  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Russo+One&family=Roboto+Condensed:wght@400;500;700&display=swap&subset=cyrillic"
        />
      </head>
      <body>
        {closed ? (
          <Maintenance message={maint.message} />
        ) : (
          <>
            {maint.on && (
              <div style={{ background: "#8a2f22", color: "#fff", textAlign: "center", padding: "8px 16px", fontSize: 15 }}>
                Включено техническое обслуживание — сайт сейчас видят только администраторы.{" "}
                <Link href="/admin" style={{ color: "#fff", fontWeight: 700 }}>Выключить в админке</Link>
              </div>
            )}
            <Header />
            {children}
            <footer className="footer">
              <div className="container">ACE · Army Compartmented Elements · National Guard, Fort Zancudo</div>
            </footer>
          </>
        )}
      </body>
    </html>
  );
}
