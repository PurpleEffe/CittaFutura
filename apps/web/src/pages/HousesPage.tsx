import { FormEvent, useEffect, useState } from 'react';
import { House } from '../types';
import { apiFetch } from '../utils/api';
import { HouseCard } from '../components/HouseCard';

export default function HousesPage() {
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [capacity, setCapacity] = useState('');
  const [services, setServices] = useState('');

  const loadHouses = async (params?: URLSearchParams) => {
    setLoading(true);
    setError(null);
    try {
      const search = params?.toString();
      const data = await apiFetch<{ houses: House[] }>(`/houses${search ? `?${search}` : ''}`);
      setHouses(data.houses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossibile caricare le case');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadHouses();
  }, []);

  const handleFilter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (capacity) params.set('capacity', capacity);
    if (services) params.set('services', services);
    void loadHouses(params);
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleFilter}
        className="flex flex-wrap items-end gap-4 rounded-lg bg-white p-4 shadow-sm"
        aria-label="Filtra le case"
      >
        <label className="flex flex-1 min-w-[200px] flex-col">
          <span className="text-sm font-medium text-slate-700">Cerca</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nome o descrizione"
            className="mt-1 rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </label>
        <label className="flex w-40 flex-col">
          <span className="text-sm font-medium text-slate-700">Capienza minima</span>
          <input
            type="number"
            min={1}
            value={capacity}
            onChange={(event) => setCapacity(event.target.value)}
            className="mt-1 rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </label>
        <label className="flex flex-1 min-w-[200px] flex-col">
          <span className="text-sm font-medium text-slate-700">Servizi</span>
          <input
            type="text"
            value={services}
            onChange={(event) => setServices(event.target.value)}
            placeholder="es. cucina,wifi"
            className="mt-1 rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </label>
        <button
          type="submit"
          className="rounded bg-brand-primary px-4 py-2 font-medium text-white hover:bg-brand-secondary"
        >
          Applica filtri
        </button>
      </form>

      {loading && <p className="text-slate-600">Caricamento in corso…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="grid gap-4 md:grid-cols-2">
          {houses.length === 0 && <p className="text-slate-600">Nessuna casa trovata.</p>}
          {houses.map((house) => (
            <HouseCard key={house.id} house={house} />
          ))}
        </div>
      )}
    </div>
  );
}
