import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import type { Booking } from '../types';
import { apiFetch } from '../utils/api';
import { StatusBadge } from '../components/StatusBadge';

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

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-base-content/70">
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

  return (
    <section className="space-y-6">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="card-title text-3xl">Le mie richieste</h1>
          {bookings.length === 0 ? (
            <p className="text-base-content/70">Non hai ancora inviato richieste.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Casa</th>
                    <th>Periodo</th>
                    <th>Persone</th>
                    <th>Stato</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-base-200/60">
                      <td className="font-medium">{booking.house.title}</td>
                      <td>{`${dayjs(booking.startDate).format('DD MMM YYYY')} → ${dayjs(booking.endDate).format('DD MMM YYYY')}`}</td>
                      <td>{booking.people}</td>
                      <td>
                        <StatusBadge status={booking.status} />
                      </td>
                      <td className="max-w-xs text-sm text-base-content/70">
                        {booking.notes ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
