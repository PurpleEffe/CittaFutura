import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-12">
      <section className="hero min-h-[420px] rounded-3xl bg-base-100 shadow-xl">
        <div className="hero-content flex-col-reverse gap-12 lg:flex-row">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-primary">
              L’accoglienza di Città Futura, organizzata e professionale
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-base-content/80">
              Gestisci in autonomia le prenotazioni delle case solidali, sincronizza il calendario e
              coordina gli arrivi anche senza connessione. Tutto in un’unica piattaforma locale-first.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/case" className="btn btn-primary btn-wide">
                Esplora le case
              </Link>
              {!user && (
                <Link to="/register" className="btn btn-outline btn-primary">
                  Crea un account
                </Link>
              )}
            </div>
          </div>
          <div className="flex-1">
            <div className="h-64 w-full rounded-2xl bg-gradient-to-tr from-primary via-secondary to-accent opacity-90 shadow-lg lg:h-80" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title">Per chi cerca ospitalità</h2>
            <p className="text-base-content/80">
              Schede dettagliate con servizi, capienza e calendario aggiornato. Invia una richiesta in
              pochi minuti e tieni traccia dell’esito.
            </p>
          </div>
        </div>
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title">Per i gestori</h2>
            <p className="text-base-content/80">
              Dashboard dedicata per approvare o rifiutare richieste, proporre nuove date e aggiornare
              l’anagrafica degli alloggi.
            </p>
          </div>
        </div>
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title">Sempre disponibile</h2>
            <p className="text-base-content/80">
              Funziona totalmente in locale: database SQLite incluso, autenticazione sicura con cookie
              httpOnly e nessuna dipendenza da servizi esterni.
            </p>
          </div>
        </div>
      </section>

      <section className="stats stats-vertical w-full shadow-lg lg:stats-horizontal">
        <div className="stat">
          <div className="stat-title">Case demo incluse</div>
          <div className="stat-value text-primary">3</div>
          <div className="stat-desc">Già pronte con servizi e immagini segnaposto</div>
        </div>
        <div className="stat">
          <div className="stat-title">Ruoli supportati</div>
          <div className="stat-value text-secondary">3</div>
          <div className="stat-desc">Utente, gestore, amministratore</div>
        </div>
        <div className="stat">
          <div className="stat-title">Flussi principali</div>
          <div className="stat-value text-accent">100%</div>
          <div className="stat-desc">Prenota, approva, controlla il calendario</div>
        </div>
      </section>
    </div>
  );
}
