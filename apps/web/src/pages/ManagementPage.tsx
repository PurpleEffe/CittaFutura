import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import type { Booking, BookingStatus, House } from '../types';
import { apiFetch } from '../utils/api';

interface BookingWithRelations extends Booking {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  house: House;
}

interface EditableHouse extends House {
  servicesText: string;
}

const statusLabels: Record<BookingStatus, string> = {
  IN_REVIEW: 'In revisione',
  APPROVED: 'Approvata',
  REJECTED: 'Rifiutata',
  CHECKED_IN: 'Check-in',
  CHECKED_OUT: 'Check-out',
  CANCELLED: 'Annullata',
};

const statusOrder: BookingStatus[] = [
  'IN_REVIEW',
  'APPROVED',
  'REJECTED',
  'CHECKED_IN',
  'CHECKED_OUT',
  'CANCELLED',
];

export default function ManagementPage() {
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<BookingStatus | 'ALL'>('IN_REVIEW');

  const [houses, setHouses] = useState<EditableHouse[]>([]);
  const [housesError, setHousesError] = useState<string | null>(null);
  const [houseMessage, setHouseMessage] = useState<string | null>(null);

  const [newHouse, setNewHouse] = useState({
    slug: '',
    title: '',
    summary: '',
    capacity: 4,
    services: '',
    photos: '',
  });
  const [creatingHouse, setCreatingHouse] = useState(false);

  const loadBookings = useCallback(async () => {
    setBookingsLoading(true);
    setBookingsError(null);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'ALL') {
        params.set('status', filterStatus);
      }
      const query = params.toString();
      const data = await apiFetch<{ bookings: BookingWithRelations[] }>(
        `/bookings${query ? `?${query}` : ''}`,
      );
      setBookings(data.bookings);
    } catch (err) {
      setBookingsError(err instanceof Error ? err.message : 'Impossibile caricare le prenotazioni');
    } finally {
      setBookingsLoading(false);
    }
  }, [filterStatus]);

  const loadHouses = useCallback(async () => {
    setHousesError(null);
    try {
      const data = await apiFetch<{ houses: House[] }>('/houses');
      setHouses(
        data.houses.map((house) => ({
          ...house,
          servicesText: house.services.join(', '),
        })),
      );
    } catch (err) {
      setHousesError(err instanceof Error ? err.message : 'Impossibile caricare le case');
    }
  }, []);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    void loadHouses();
  }, [loadHouses]);

  const handleStatusChange = async (bookingId: string, status: BookingStatus) => {
    try {
      await apiFetch(`/bookings/${bookingId}/status`, {
        method: 'PATCH',
        json: { status },
      });
      await loadBookings();
    } catch (err) {
      setBookingsError(err instanceof Error ? err.message : 'Aggiornamento stato non riuscito');
    }
  };

  const handleHouseFieldChange = (
    id: string,
    field: keyof EditableHouse | 'servicesText',
    value: string | number,
  ) => {
    setHouses((prev) =>
      prev.map((house) => (house.id === id ? { ...house, [field]: value } : house)),
    );
  };

  const saveHouse = async (house: EditableHouse) => {
    try {
      await apiFetch(`/houses/${house.id}`, {
        method: 'PUT',
        json: {
          title: house.title,
          summary: house.summary,
          capacity: house.capacity,
          services: house.servicesText
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          photos: house.photos,
        },
      });
      setHouseMessage('Casa aggiornata con successo');
      await loadHouses();
    } catch (err) {
      setHousesError(err instanceof Error ? err.message : 'Salvataggio non riuscito');
    }
  };

  const deleteHouse = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa casa?')) return;
    try {
      await apiFetch(`/houses/${id}`, { method: 'DELETE' });
      setHouseMessage('Casa eliminata');
      await loadHouses();
    } catch (err) {
      setHousesError(err instanceof Error ? err.message : 'Eliminazione non riuscita');
    }
  };

  const handleCreateHouse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHouseMessage(null);
    setHousesError(null);
    setCreatingHouse(true);
    try {
      await apiFetch('/houses', {
        method: 'POST',
        json: {
          slug: newHouse.slug,
          title: newHouse.title,
          summary: newHouse.summary || undefined,
          capacity: Number(newHouse.capacity),
          services: newHouse.services
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          photos: newHouse.photos
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        },
      });
      setNewHouse({ slug: '', title: '', summary: '', capacity: 4, services: '', photos: '' });
      setHouseMessage('Casa creata con successo');
      await loadHouses();
    } catch (err) {
      setHousesError(err instanceof Error ? err.message : 'Creazione non riuscita');
    } finally {
      setCreatingHouse(false);
    }
  };

  const groupedBookings = useMemo(() => {
    return bookings.reduce<Record<BookingStatus, BookingWithRelations[]>>((acc, booking) => {
      acc[booking.status] = acc[booking.status] ?? [];
      acc[booking.status]!.push(booking);
      return acc;
    }, {} as Record<BookingStatus, BookingWithRelations[]>);
  }, [bookings]);

  return (
    <div className="space-y-8">
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-brand-secondary">Richieste</h1>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            Stato
            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value as BookingStatus | 'ALL')}
              className="rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="ALL">Tutti</option>
              {statusOrder.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </label>
        </div>
        {bookingsLoading && <p className="mt-4 text-slate-600">Caricamento prenotazioni…</p>}
        {bookingsError && <p className="mt-4 text-red-600">{bookingsError}</p>}
        {!bookingsLoading && !bookingsError && (
          <div className="mt-4 space-y-6">
            {statusOrder
              .filter((status) => filterStatus === 'ALL' || filterStatus === status)
              .map((status) => (
                <div key={status}>
                  <h2 className="text-lg font-semibold text-slate-700">{statusLabels[status]}</h2>
                  {groupedBookings[status]?.length ? (
                    <ul className="mt-2 space-y-3">
                      {groupedBookings[status]!.map((booking) => (
                        <li key={booking.id} className="rounded border border-slate-200 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-brand-secondary">{booking.house.title}</p>
                              <p className="text-sm text-slate-600">
                                {dayjs(booking.startDate).format('DD MMM YYYY')} →{' '}
                                {dayjs(booking.endDate).format('DD MMM YYYY')} ({booking.people} persone)
                              </p>
                              <p className="text-xs text-slate-500">
                                Richiedente: {booking.user.name ?? booking.user.email} ({booking.user.email})
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <select
                                value={booking.status}
                                onChange={(event) =>
                                  handleStatusChange(booking.id, event.target.value as BookingStatus)
                                }
                                className="rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                              >
                                {statusOrder.map((statusOption) => (
                                  <option key={statusOption} value={statusOption}>
                                    {statusLabels[statusOption]}
                                  </option>
                                ))}
                              </select>
                              {booking.notes && (
                                <p className="text-xs text-slate-500">Note: {booking.notes}</p>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-slate-600">Nessuna prenotazione.</p>
                  )}
                </div>
              ))}
          </div>
        )}
      </section>

      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-brand-secondary">Gestione case</h2>
        {houseMessage && <p className="mt-2 text-emerald-600">{houseMessage}</p>}
        {housesError && <p className="mt-2 text-red-600">{housesError}</p>}

        <div className="mt-4 space-y-4">
          {houses.map((house) => (
            <div key={house.id} className="rounded border border-slate-200 p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm text-slate-700">
                  Nome
                  <input
                    value={house.title}
                    onChange={(event) =>
                      handleHouseFieldChange(house.id, 'title', event.target.value)
                    }
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </label>
                <label className="text-sm text-slate-700">
                  Slug
                  <input
                    value={house.slug}
                    disabled
                    className="mt-1 w-full rounded border border-slate-300 bg-slate-100 px-3 py-2"
                  />
                </label>
                <label className="text-sm text-slate-700 md:col-span-2">
                  Descrizione
                  <textarea
                    value={house.summary ?? ''}
                    onChange={(event) =>
                      handleHouseFieldChange(house.id, 'summary', event.target.value)
                    }
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </label>
                <label className="text-sm text-slate-700">
                  Capienza
                  <input
                    type="number"
                    min={1}
                    value={house.capacity}
                    onChange={(event) =>
                      handleHouseFieldChange(house.id, 'capacity', Number(event.target.value))
                    }
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </label>
                <label className="text-sm text-slate-700">
                  Servizi (separati da virgola)
                  <input
                    value={house.servicesText}
                    onChange={(event) =>
                      handleHouseFieldChange(house.id, 'servicesText', event.target.value)
                    }
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </label>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => saveHouse(house)}
                  className="rounded bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-secondary"
                >
                  Salva
                </button>
                <button
                  type="button"
                  onClick={() => deleteHouse(house.id)}
                  className="rounded border border-red-400 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Elimina
                </button>
              </div>
            </div>
          ))}
        </div>

        <form className="mt-6 space-y-3 border-t border-slate-200 pt-6" onSubmit={handleCreateHouse}>
          <h3 className="text-lg font-semibold text-brand-secondary">Nuova casa</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm text-slate-700">
              Slug
              <input
                value={newHouse.slug}
                required
                onChange={(event) => setNewHouse((prev) => ({ ...prev, slug: event.target.value }))}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </label>
            <label className="text-sm text-slate-700">
              Nome
              <input
                value={newHouse.title}
                required
                onChange={(event) => setNewHouse((prev) => ({ ...prev, title: event.target.value }))}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </label>
            <label className="text-sm text-slate-700 md:col-span-2">
              Descrizione
              <textarea
                value={newHouse.summary}
                onChange={(event) => setNewHouse((prev) => ({ ...prev, summary: event.target.value }))}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </label>
            <label className="text-sm text-slate-700">
              Capienza
              <input
                type="number"
                min={1}
                value={newHouse.capacity}
                onChange={(event) => setNewHouse((prev) => ({ ...prev, capacity: Number(event.target.value) }))}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </label>
            <label className="text-sm text-slate-700">
              Servizi (virgola)
              <input
                value={newHouse.services}
                onChange={(event) => setNewHouse((prev) => ({ ...prev, services: event.target.value }))}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </label>
            <label className="text-sm text-slate-700">
              Foto (URL separati da virgola)
              <input
                value={newHouse.photos}
                onChange={(event) => setNewHouse((prev) => ({ ...prev, photos: event.target.value }))}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={creatingHouse}
            className="rounded bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-secondary disabled:opacity-70"
          >
            {creatingHouse ? 'Salvataggio…' : 'Aggiungi casa'}
          </button>
        </form>
      </section>
    </div>
  );
}
