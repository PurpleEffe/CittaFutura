import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import type { CalendarEvent, House } from '../types';
import { apiFetch } from '../utils/api';

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
    return <p className="text-slate-600">Caricamento…</p>;
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  if (!house) {
    return <p className="text-slate-600">Casa non trovata.</p>;
  }

  const sortedEvents = [...events].sort((a, b) =>
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-brand-secondary">{house.title}</h1>
        <p className="mt-2 text-slate-700">{house.summary}</p>
        <p className="mt-3 text-sm text-slate-600">Capienza massima: {house.capacity} persone</p>
        {house.services.length > 0 && (
          <div className="mt-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Servizi</h2>
            <ul className="mt-2 flex flex-wrap gap-2 text-sm text-slate-600">
              {house.services.map((service) => (
                <li key={service} className="rounded-full bg-slate-100 px-3 py-1">
                  {service}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-6">
          <Link
            to={`/prenota/${house.slug}`}
            className="rounded bg-brand-primary px-5 py-2 font-medium text-white hover:bg-brand-secondary"
          >
            Richiedi un soggiorno
          </Link>
        </div>
      </section>

      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-brand-secondary">Calendario</h2>
        <p className="mt-2 text-sm text-slate-600">
          Mostriamo gli intervalli già confermati e i periodi non disponibili. Per altre date puoi
          inviare una richiesta.
        </p>
        {sortedEvents.length === 0 ? (
          <p className="mt-4 text-slate-600">Nessun evento pianificato.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {sortedEvents.map((event) => (
              <li
                key={event.id}
                className="flex items-start justify-between rounded border border-slate-200 bg-slate-50 p-3"
              >
                <div>
                  <p className="font-medium text-slate-700">{event.title}</p>
                  <p className="text-sm text-slate-600">
                    {dayjs(event.startDate).format('DD MMM YYYY')} →{' '}
                    {dayjs(event.endDate).format('DD MMM YYYY')}
                  </p>
                  {event.notes && <p className="text-sm text-slate-500">{event.notes}</p>}
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    event.type === 'booking' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {event.type === 'booking' ? 'Prenotazione' : 'Blocco'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
