import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import type { House } from '../types';
import { apiFetch } from '../utils/api';
import { useToast } from '../components/ToastProvider';

export default function BookingPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [house, setHouse] = useState<House | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const [form, setForm] = useState({
    startDate: dayjs().add(7, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().add(10, 'day').format('YYYY-MM-DD'),
    people: 2,
    notes: '',
  });

  useEffect(() => {
    if (!slug) return;
    const loadHouse = async () => {
      try {
        const data = await apiFetch<{ house: House }>(`/houses/${slug}`);
        setHouse(data.house);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Impossibile caricare la casa');
      }
    };

    void loadHouse();
  }, [slug]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!house) return;
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch<{ booking: unknown }>('/bookings', {
        method: 'POST',
        json: {
          houseId: house.id,
          startDate: form.startDate,
          endDate: form.endDate,
          people: form.people,
          notes: form.notes || undefined,
        },
      });
      showToast('Richiesta inviata! Controlla la tua area personale.', 'success');
      setTimeout(() => navigate('/area'), 800);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossibile inviare la richiesta';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!house) {
    if (error) {
      return (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <span className="loading loading-spinner" aria-hidden="true" />
        <span>Caricamento…</span>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-2xl">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body space-y-4">
          <div>
            <h1 className="card-title text-3xl">Richiedi {house.title}</h1>
            <p className="text-sm text-base-content/70">
              Inserisci il periodo desiderato. Un gestore verificherà le disponibilità e ti aggiornerà
              dalla tua area personale.
            </p>
          </div>
          {error && (
            <div role="alert" className="alert alert-error">
              <span>{error}</span>
            </div>
          )}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="form-control w-full">
                <span className="label-text">Arrivo</span>
                <input
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
                  className="input input-bordered"
                />
              </label>
              <label className="form-control w-full">
                <span className="label-text">Partenza</span>
                <input
                  type="date"
                  required
                  value={form.endDate}
                  min={form.startDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
                  className="input input-bordered"
                />
              </label>
            </div>
            <label className="form-control">
              <span className="label-text">Numero di persone</span>
              <input
                type="number"
                min={1}
                max={house.capacity}
                value={form.people}
                onChange={(event) => setForm((prev) => ({ ...prev, people: Number(event.target.value) }))}
                className="input input-bordered"
              />
            </label>
            <label className="form-control">
              <span className="label-text">Note aggiuntive</span>
              <textarea
                rows={4}
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                className="textarea textarea-bordered"
                placeholder="Es. attività previste, esigenze particolari"
              />
            </label>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Invio in corso…' : 'Invia richiesta'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
