import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import type { House } from '../types';
import { apiFetch } from '../utils/api';

export default function BookingPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [house, setHouse] = useState<House | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
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
    setSuccess(null);
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
      setSuccess('Richiesta inviata! Riceverai un aggiornamento via email.');
      setTimeout(() => navigate('/area'), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossibile inviare la richiesta');
    } finally {
      setSubmitting(false);
    }
  };

  if (!house) {
    return error ? <p className="text-red-600">{error}</p> : <p>Caricamento…</p>;
  }

  return (
    <section className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-brand-secondary">Richiedi {house.title}</h1>
      <p className="mt-2 text-sm text-slate-600">
        Inserisci il periodo desiderato. Riceverai conferma da un gestore quanto prima.
      </p>
      {error && (
        <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="mt-4 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {success}
        </div>
      )}
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Arrivo</span>
            <input
              type="date"
              required
              value={form.startDate}
              onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Partenza</span>
            <input
              type="date"
              required
              value={form.endDate}
              min={form.startDate}
              onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </label>
        </div>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Numero di persone</span>
          <input
            type="number"
            min={1}
            max={house.capacity}
            value={form.people}
            onChange={(event) => setForm((prev) => ({ ...prev, people: Number(event.target.value) }))}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Note aggiuntive</span>
          <textarea
            rows={4}
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            placeholder="Es. attività previste, esigenze particolari"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-brand-primary px-4 py-2 font-medium text-white hover:bg-brand-secondary disabled:opacity-70"
        >
          {submitting ? 'Invio in corso…' : 'Invia richiesta'}
        </button>
      </form>
    </section>
  );
}
