import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import type { Booking } from '../types';
import { apiFetch } from '../utils/api';

interface BookingWithHouse extends Booking {
  house: {
    id: string;
    title: string;
    slug: string;
  };
}

export default function ProfilePage() {
  const [bookings, setBookings] = useState<BookingWithHouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiFetch<{ bookings: BookingWithHouse[] }>('/bookings/me');
        setBookings(data.bookings);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Impossibile caricare le prenotazioni');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const statusLabels: Record<string, string> = {
    IN_REVIEW: 'In revisione',
    APPROVED: 'Approvata',
    REJECTED: 'Rifiutata',
    CHECKED_IN: 'Check-in',
    CHECKED_OUT: 'Check-out',
    CANCELLED: 'Annullata',
  };

  if (loading) {
    return <p className="text-slate-600">Caricamento…</p>;
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-brand-secondary">Le mie richieste</h1>
      {bookings.length === 0 ? (
        <p className="text-slate-600">Non hai ancora inviato richieste.</p>
      ) : (
        <ul className="space-y-4">
          {bookings.map((booking) => (
            <li key={booking.id} className="rounded-lg bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-brand-secondary">{booking.house.title}</p>
                  <p className="text-sm text-slate-600">
                    {dayjs(booking.startDate).format('DD MMM YYYY')} →{' '}
                    {dayjs(booking.endDate).format('DD MMM YYYY')} ({booking.people} persone)
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                  {statusLabels[booking.status] ?? booking.status}
                </span>
              </div>
              {booking.notes && <p className="mt-3 text-sm text-slate-600">Note: {booking.notes}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
