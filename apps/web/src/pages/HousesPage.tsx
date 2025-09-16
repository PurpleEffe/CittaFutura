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
    <div className="space-y-10">
      <section className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="card-title text-3xl">Case disponibili</h1>
          <p className="text-base-content/70">
            Filtra per capienza o servizi e scopri gli alloggi già presenti nel database. Tutte le
            richieste sono gratuite e gestite direttamente dal team di Città Futura.
          </p>
          <form
            onSubmit={handleFilter}
            className="mt-6 grid gap-4 md:grid-cols-4"
            aria-label="Filtra le case"
          >
            <label className="form-control w-full md:col-span-2">
              <span className="label-text">Cerca</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nome o descrizione"
                className="input input-bordered"
              />
            </label>
            <label className="form-control w-full">
              <span className="label-text">Capienza minima</span>
              <input
                type="number"
                min={1}
                value={capacity}
                onChange={(event) => setCapacity(event.target.value)}
                className="input input-bordered"
              />
            </label>
            <label className="form-control w-full">
              <span className="label-text">Servizi (virgola)</span>
              <input
                type="text"
                value={services}
                onChange={(event) => setServices(event.target.value)}
                placeholder="es. cucina,wifi"
                className="input input-bordered"
              />
            </label>
            <div className="md:col-span-4">
              <button type="submit" className="btn btn-primary">
                Applica filtri
              </button>
            </div>
          </form>
        </div>
      </section>

      {loading && (
        <div className="flex items-center gap-3 text-base-content/70">
          <span className="loading loading-dots loading-md" aria-hidden="true" />
          <span>Caricamento in corso…</span>
        </div>
      )}

      {error && (
        <div role="alert" className="alert alert-error shadow-lg">
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {houses.length === 0 ? (
            <div className="col-span-full" role="status">
              <div className="alert alert-info">
                <span>Nessuna casa corrisponde ai filtri selezionati.</span>
              </div>
            </div>
          ) : (
            houses.map((house) => <HouseCard key={house.id} house={house} />)
          )}
        </div>
      )}
    </div>
  );
}
