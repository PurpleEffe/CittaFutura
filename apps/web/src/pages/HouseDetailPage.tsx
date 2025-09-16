import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import type { CalendarEvent, House } from '../types';
import { apiFetch } from '../utils/api';
import { AvailabilityCalendar } from '../components/AvailabilityCalendar';

type HouseDetail = House & {
  bookings: Array<{
    id: string;
    status: string;
    startDate: string;
    endDate: string;
  }>;
  blackout: Array<{
    id: string;
    startDate: string;
    endDate: string;
    reason?: string | null;
  }>;
};

export default function HouseDetailPage() {
  const { slug } = useParams();
  const [house, setHouse] = useState<HouseDetail | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<{ house: HouseDetail }>(`/houses/${slug}`);
        setHouse(data.house);
        const calendar = await apiFetch<{ events: CalendarEvent[] }>(`/calendar/house/${data.house.id}`);
        setEvents(calendar.events);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Impossibile caricare la casa');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-base-content/70">
        <span className="loading loading-spinner" aria-hidden="true" />
        <span>Caricamento…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>{error}</span>
      </div>
    );
  }

  if (!house) {
    return (
      <div className="alert alert-warning">
        <span>Casa non trovata.</span>
      </div>
    );
  }

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  return (
    <div className="space-y-10">
      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h1 className="card-title text-3xl">{house.title}</h1>
            <p className="text-base-content/80">{house.summary}</p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-base-content/70">
              <span className="badge badge-lg badge-outline">{house.capacity} posti disponibili</span>
              <span className="badge badge-outline">Aggiornata {dayjs(house.updatedAt).format('DD MMM YYYY')}</span>
            </div>
            {house.services.length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-base-content/60">
                  Servizi inclusi
                </h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {house.services.map((service) => (
                    <span key={service} className="badge badge-primary badge-outline">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="card-actions mt-8">
              <Link to={`/prenota/${house.slug}`} className="btn btn-primary">
                Richiedi un soggiorno
              </Link>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title text-xl">Informazioni rapide</h2>
            <ul className="space-y-2 text-sm text-base-content/80">
              <li>
                <strong>Slug:</strong> {house.slug}
              </li>
              <li>
                <strong>Creata il:</strong> {dayjs(house.createdAt).format('DD MMM YYYY')}
              </li>
              <li>
                <strong>Prenotazioni totali:</strong> {house.bookings.length}
              </li>
              <li>
                <strong>Periodi di blackout:</strong> {house.blackout.length}
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="card bg-base-100 shadow-xl">
        <div className="card-body space-y-6">
          <div>
            <h2 className="card-title text-2xl">Calendario disponibilità</h2>
            <p className="text-sm text-base-content/70">
              Giorni evidenziati in blu indicano prenotazioni approvate, in giallo i periodi di blocco.
              Puoi comunque inviare una richiesta per proporre nuove date.
            </p>
          </div>
          <AvailabilityCalendar events={events} />
        </div>
      </section>

      <section className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title text-2xl">Cronologia</h2>
          {sortedEvents.length === 0 ? (
            <p className="text-base-content/70">Nessuna prenotazione o blocco registrato al momento.</p>
          ) : (
            <ul className="timeline timeline-snap-icon max-md:timeline-compact timeline-vertical">
              {sortedEvents.map((event) => (
                <li key={event.id}>
                  <div className="timeline-middle">
                    <span
                      className={`badge ${
                        event.type === 'booking' ? 'badge-primary' : 'badge-warning'
                      }`}
                    >
                      {event.type === 'booking' ? 'Prenotazione' : 'Blocco'}
                    </span>
                  </div>
                  <div className="timeline-end timeline-box bg-base-200 text-sm">
                    <p className="font-semibold text-base-content">
                      {dayjs(event.startDate).format('DD MMM YYYY')} →{' '}
                      {dayjs(event.endDate).format('DD MMM YYYY')}
                    </p>
                    <p className="text-base-content/80">{event.title}</p>
                    {event.notes && <p className="text-xs text-base-content/60">{event.notes}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
