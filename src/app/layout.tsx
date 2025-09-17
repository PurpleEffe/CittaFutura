import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Città Futura · Prenotazioni", 
  description:
    "Programma residenziale di Città Futura per progetti culturali, educativi e di innovazione civica.",
  alternates: {
    canonical: "https://cittafutura.example.org",
  },
  openGraph: {
    title: "Città Futura · Prenotazioni",
    description:
      "Catalogo degli spazi, calendario disponibilità e richieste di prenotazione della rete Città Futura.",
    type: "website",
    locale: "it_IT",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1 bg-white">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
