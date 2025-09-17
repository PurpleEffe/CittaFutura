export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} Città Futura. Programma istituzionale di innovazione civica.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            className="underline-offset-2 hover:underline"
            href="https://www.comune.example.it/cittafutura"
            target="_blank"
            rel="noreferrer"
          >
            Portale istituzionale
          </a>
          <a
            className="underline-offset-2 hover:underline"
            href="mailto:ospitalita@cittafutura.example"
          >
            ospitalita@cittafutura.example
          </a>
        </div>
      </div>
    </footer>
  );
}
