import { Link } from 'react-router-dom';
import type { House } from '../types';

interface HouseCardProps {
  house: House;
}

export function HouseCard({ house }: HouseCardProps) {
  return (
    <article className="flex flex-col justify-between rounded-lg bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-xl font-semibold text-brand-secondary">{house.title}</h3>
        <p className="mt-2 text-sm text-slate-600">Capienza: {house.capacity} persone</p>
        {house.summary && <p className="mt-2 text-slate-700">{house.summary}</p>}
        {house.services.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2 text-sm text-slate-600">
            {house.services.map((service) => (
              <li key={service} className="rounded-full bg-slate-100 px-3 py-1">
                {service}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to={`/case/${house.slug}`}
          className="rounded bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-secondary"
        >
          Dettagli
        </Link>
        <Link
          to={`/prenota/${house.slug}`}
          className="rounded border border-brand-primary px-4 py-2 text-sm font-medium text-brand-primary hover:bg-blue-50"
        >
          Richiedi disponibilità
        </Link>
      </div>
    </article>
  );
}
