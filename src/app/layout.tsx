import type { Metadata } from "next";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "ACE — Army Compartmented Elements",
  description: "Портал подразделения ACE: справочник, отчёты на повышение, переаттестация.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
        <Header />
        {children}
        <footer className="footer">
          <div className="container">ACE · Army Compartmented Elements · National Guard, Fort Zancudo</div>
        </footer>
      </body>
    </html>
  );
}
