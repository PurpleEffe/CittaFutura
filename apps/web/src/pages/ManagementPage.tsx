import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import type { Booking, BookingStatus, House } from '../types';
import { apiFetch } from '../utils/api';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/ToastProvider';

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
  photosText: string;
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

function formatRange(booking: Booking) {
  return `${dayjs(booking.startDate).format('DD MMM YYYY')} → ${dayjs(booking.endDate).format('DD MMM YYYY')}`;
}

export default function ManagementPage() {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<BookingStatus | 'ALL'>('IN_REVIEW');

  const [houses, setHouses] = useState<EditableHouse[]>([]);
  const [housesError, setHousesError] = useState<string | null>(null);
  const [creatingHouse, setCreatingHouse] = useState(false);
  const [newHouse, setNewHouse] = useState({
    slug: '',
    title: '',
    summary: '',
    capacity: 4,
    services: '',
    photos: '',
  });

  const [pendingAction, setPendingAction] = useState<{
    bookingId: string;
    status: BookingStatus;
    summary: string;
  } | null>(null);

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
    } catch (error) {
      setBookingsError(
        error instanceof Error ? error.message : 'Impossibile caricare le prenotazioni',
      );
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
          photosText: house.photos.join(', '),
        })),
      );
    } catch (error) {
      setHousesError(error instanceof Error ? error.message : 'Impossibile caricare le case');
    }
  }, []);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    void loadHouses();
  }, [loadHouses]);

  const groupedBookings = useMemo(() => {
    return bookings.reduce<Record<BookingStatus, BookingWithRelations[]>>((acc, booking) => {
      acc[booking.status] = acc[booking.status] ?? [];
      acc[booking.status]!.push(booking);
      return acc;
    }, {} as Record<BookingStatus, BookingWithRelations[]>);
  }, [bookings]);

  const updateBookingStatus = useCallback(
    async (bookingId: string, status: BookingStatus) => {
      try {
        await apiFetch(`/bookings/${bookingId}/status`, {
          method: 'PATCH',
          json: { status },
        });
        showToast(`Prenotazione aggiornata a "${statusLabels[status]}"`, 'success');
        await loadBookings();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Aggiornamento stato non riuscito';
        setBookingsError(message);
        showToast(message, 'error');
      }
    },
    [loadBookings, showToast],
  );

  const handleStatusSelection = (booking: BookingWithRelations, status: BookingStatus) => {
    if (status === booking.status) return;
    if (status === 'APPROVED' || status === 'REJECTED') {
      setPendingAction({
        bookingId: booking.id,
        status,
        summary: `${booking.house.title} · ${formatRange(booking)}`,
      });
      return;
    }

    void updateBookingStatus(booking.id, status);
  };

  const confirmStatusChange = async () => {
    if (!pendingAction) return;
    await updateBookingStatus(pendingAction.bookingId, pendingAction.status);
    setPendingAction(null);
  };

  const handleHouseFieldChange = (
    id: string,
    field: keyof EditableHouse | 'servicesText' | 'photosText',
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
          summary: house.summary ?? undefined,
          capacity: house.capacity,
          services: house.servicesText
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          photos: house.photosText
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        },
      });
      showToast('Casa aggiornata con successo', 'success');
      await loadHouses();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Salvataggio non riuscito';
      setHousesError(message);
      showToast(message, 'error');
    }
  };

  const deleteHouse = async (id: string) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa casa?')) return;
    try {
      await apiFetch(`/houses/${id}`, { method: 'DELETE' });
      showToast('Casa eliminata', 'info');
      await loadHouses();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Eliminazione non riuscita';
      setHousesError(message);
      showToast(message, 'error');
    }
  };

  const handleCreateHouse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreatingHouse(true);
    setHousesError(null);
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
      showToast('Nuova casa creata', 'success');
      setNewHouse({ slug: '', title: '', summary: '', capacity: 4, services: '', photos: '' });
      await loadHouses();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Creazione non riuscita';
      setHousesError(message);
      showToast(message, 'error');
    } finally {
      setCreatingHouse(false);
    }
  };

  return (
    <div className="drawer lg:drawer-open">
      <input id="management-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-base-content">Richieste in arrivo</h1>
            <p className="text-sm text-base-content/70">
              Gestisci le prenotazioni, evita sovrapposizioni e aggiorna lo stato per informare gli
              ospiti.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="form-control w-44">
              <label className="label">
                <span className="label-text">Filtra stato</span>
              </label>
              <select
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value as BookingStatus | 'ALL')}
                className="select select-bordered"
              >
                <option value="ALL">Tutti</option>
                {statusOrder.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </div>
            <label htmlFor="management-drawer" className="btn btn-ghost lg:hidden">
              Gestione case
            </label>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body space-y-4">
            {bookingsLoading && (
              <div className="flex items-center gap-2 text-base-content/70">
                <span className="loading loading-spinner" aria-hidden="true" />
                <span>Caricamento prenotazioni…</span>
              </div>
            )}
            {bookingsError && (
              <div className="alert alert-error">
                <span>{bookingsError}</span>
              </div>
            )}
            {!bookingsLoading && !bookingsError && (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Casa</th>
                      <th>Periodo</th>
                      <th>Richiedente</th>
                      <th>Persone</th>
                      <th>Stato</th>
                      <th className="w-48">Aggiorna</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusOrder
                      .filter((status) => filterStatus === 'ALL' || filterStatus === status)
                      .flatMap((status) => groupedBookings[status] ?? [])
                      .map((booking) => (
                        <tr key={booking.id} className="hover:bg-base-200/60">
                          <td>
                            <div className="font-semibold">{booking.house.title}</div>
                            {booking.notes && (
                              <div className="text-xs text-base-content/60">Note: {booking.notes}</div>
                            )}
                          </td>
                          <td>{formatRange(booking)}</td>
                          <td>
                            <div className="font-medium">
                              {booking.user.name ?? booking.user.email}
                            </div>
                            <div className="text-xs text-base-content/60">{booking.user.email}</div>
                          </td>
                          <td>{booking.people}</td>
                          <td>
                            <StatusBadge status={booking.status} />
                          </td>
                          <td>
                            <select
                              value={booking.status}
                              onChange={(event) =>
                                handleStatusSelection(
                                  booking,
                                  event.target.value as BookingStatus,
                                )
                              }
                              className="select select-bordered select-sm"
                            >
                              {statusOrder.map((status) => (
                                <option key={status} value={status}>
                                  {statusLabels[status]}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="drawer-side z-30">
        <label htmlFor="management-drawer" className="drawer-overlay" aria-label="chiudi" />
        <div className="flex h-full w-full max-w-md flex-col gap-6 bg-base-200 p-6">
          <div>
            <h2 className="text-2xl font-semibold text-base-content">Gestione case</h2>
            <p className="text-sm text-base-content/70">
              Aggiorna descrizioni, servizi e capienza direttamente da qui.
            </p>
          </div>
          {housesError && (
            <div className="alert alert-error">
              <span>{housesError}</span>
            </div>
          )}
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {houses.map((house) => (
              <div key={house.id} className="card bg-base-100 shadow-md">
                <div className="card-body space-y-3">
                  <div className="grid gap-3">
                    <label className="form-control">
                      <span className="label-text">Nome</span>
                      <input
                        value={house.title}
                        onChange={(event) =>
                          handleHouseFieldChange(house.id, 'title', event.target.value)
                        }
                        className="input input-bordered"
                      />
                    </label>
                    <label className="form-control">
                      <span className="label-text">Slug</span>
                      <input value={house.slug} disabled className="input input-bordered" />
                    </label>
                    <label className="form-control">
                      <span className="label-text">Descrizione</span>
                      <textarea
                        value={house.summary ?? ''}
                        onChange={(event) =>
                          handleHouseFieldChange(house.id, 'summary', event.target.value)
                        }
                        className="textarea textarea-bordered"
                      />
                    </label>
                    <label className="form-control">
                      <span className="label-text">Capienza</span>
                      <input
                        type="number"
                        min={1}
                        value={house.capacity}
                        onChange={(event) =>
                          handleHouseFieldChange(
                            house.id,
                            'capacity',
                            Number(event.target.value),
                          )
                        }
                        className="input input-bordered"
                      />
                    </label>
                    <label className="form-control">
                      <span className="label-text">Servizi (virgola)</span>
                      <input
                        value={house.servicesText}
                        onChange={(event) =>
                          handleHouseFieldChange(
                            house.id,
                            'servicesText',
                            event.target.value,
                          )
                        }
                        className="input input-bordered"
                      />
                    </label>
                    <label className="form-control">
                      <span className="label-text">Foto (URL, virgola)</span>
                      <input
                        value={house.photosText}
                        onChange={(event) =>
                          handleHouseFieldChange(
                            house.id,
                            'photosText',
                            event.target.value,
                          )
                        }
                        className="input input-bordered"
                      />
                    </label>
                  </div>
                  <div className="card-actions justify-end">
                    <button
                      type="button"
                      onClick={() => saveHouse(house)}
                      className="btn btn-sm btn-primary"
                    >
                      Salva
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteHouse(house.id)}
                      className="btn btn-sm btn-ghost text-error"
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card bg-base-100 shadow-md">
            <div className="card-body space-y-3">
              <h3 className="card-title text-lg">Nuova casa</h3>
              <form className="space-y-3" onSubmit={handleCreateHouse}>
                <label className="form-control">
                  <span className="label-text">Slug</span>
                  <input
                    value={newHouse.slug}
                    onChange={(event) =>
                      setNewHouse((prev) => ({ ...prev, slug: event.target.value }))
                    }
                    required
                    className="input input-bordered"
                  />
                </label>
                <label className="form-control">
                  <span className="label-text">Nome</span>
                  <input
                    value={newHouse.title}
                    onChange={(event) =>
                      setNewHouse((prev) => ({ ...prev, title: event.target.value }))
                    }
                    required
                    className="input input-bordered"
                  />
                </label>
                <label className="form-control">
                  <span className="label-text">Descrizione</span>
                  <textarea
                    value={newHouse.summary}
                    onChange={(event) =>
                      setNewHouse((prev) => ({ ...prev, summary: event.target.value }))
                    }
                    className="textarea textarea-bordered"
                  />
                </label>
                <label className="form-control">
                  <span className="label-text">Capienza</span>
                  <input
                    type="number"
                    min={1}
                    value={newHouse.capacity}
                    onChange={(event) =>
                      setNewHouse((prev) => ({ ...prev, capacity: Number(event.target.value) }))
                    }
                    className="input input-bordered"
                  />
                </label>
                <label className="form-control">
                  <span className="label-text">Servizi (virgola)</span>
                  <input
                    value={newHouse.services}
                    onChange={(event) =>
                      setNewHouse((prev) => ({ ...prev, services: event.target.value }))
                    }
                    className="input input-bordered"
                  />
                </label>
                <label className="form-control">
                  <span className="label-text">Foto (URL, virgola)</span>
                  <input
                    value={newHouse.photos}
                    onChange={(event) =>
                      setNewHouse((prev) => ({ ...prev, photos: event.target.value }))
                    }
                    className="input input-bordered"
                  />
                </label>
                <button type="submit" className="btn btn-primary w-full" disabled={creatingHouse}>
                  {creatingHouse ? 'Salvataggio…' : 'Aggiungi casa'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {pendingAction && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold">Confermi l’aggiornamento?</h3>
            <p className="py-4 text-sm text-base-content/80">
              Vuoi impostare lo stato su <strong>{statusLabels[pendingAction.status]}</strong> per
              <br />
              <span className="font-medium">{pendingAction.summary}</span>?
            </p>
            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={() => setPendingAction(null)}>
                Annulla
              </button>
              <button type="button" className="btn btn-primary" onClick={confirmStatusChange}>
                Conferma
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
