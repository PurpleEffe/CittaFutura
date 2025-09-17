import Link from "next/link";
import type { Route } from "next";

const links = [
  { href: "/", label: "Città Futura" },
  { href: "/case", label: "Case" },
  { href: "/admin", label: "Admin" },
] satisfies { href: Route; label: string }[];

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex flex-col">
          <Link href="/" className="text-lg font-semibold text-slate-900">
            Città Futura · Prenotazioni
          </Link>
          <p className="text-xs text-slate-500">
            Programmi residenziali e servizi per il quartiere
          </p>
        </div>
        <nav className="flex gap-4 text-sm font-medium text-slate-600">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
