import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-brand-secondary">Città Futura – Prenotazioni</h1>
        <p className="mt-4 text-lg text-slate-700">
          Un punto unico per scoprire e prenotare gratuitamente gli alloggi della rete solidale di
          Città Futura. Consulta il calendario, invia richieste e coordina gli arrivi anche senza
          connessione.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            to="/case"
            className="rounded bg-brand-primary px-6 py-3 text-white shadow hover:bg-brand-secondary"
          >
            Esplora le case
          </Link>
          {!user && (
            <Link
              to="/register"
              className="rounded border border-brand-primary px-6 py-3 text-brand-primary hover:bg-blue-50"
            >
              Crea un account
            </Link>
          )}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-brand-secondary">Per chi cerca ospitalità</h2>
          <p className="mt-2 text-slate-700">
            Sfoglia le schede delle case disponibili, verifica i servizi offerti e invia una richiesta
            di soggiorno in pochi passaggi.
          </p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-brand-secondary">Per i gestori</h2>
          <p className="mt-2 text-slate-700">
            Gestisci prenotazioni, approva o rifiuta richieste, aggiorna le disponibilità e blocca le
            date per eventi o manutenzioni.
          </p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-brand-secondary">Sempre disponibile</h2>
          <p className="mt-2 text-slate-700">
            L’applicazione funziona in locale senza servizi esterni. Tutto ciò che serve è il tuo
            computer.
          </p>
        </div>
      </section>
    </div>
  );
}
