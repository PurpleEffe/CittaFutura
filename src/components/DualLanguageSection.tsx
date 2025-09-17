import type { ReactNode } from "react";

interface DualLanguageSectionProps {
  title: string;
  lead?: string;
  it: ReactNode;
  en: ReactNode;
}

export function DualLanguageSection({
  title,
  lead,
  it,
  en,
}: DualLanguageSectionProps) {
  return (
    <section className="mx-auto my-12 max-w-5xl px-4">
      <header className="mb-6 space-y-2">
        <p className="text-xs uppercase tracking-wide text-slate-500">Programma istituzionale</p>
        <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
        {lead ? <p className="text-sm text-slate-600">{lead}</p> : null}
      </header>
      <div className="grid gap-8 md:grid-cols-2">
        <article className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Italiano</p>
          <div className="text-sm text-slate-700">{it}</div>
        </article>
        <article className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">English</p>
          <div className="text-sm text-slate-700">{en}</div>
        </article>
      </div>
    </section>
  );
}
