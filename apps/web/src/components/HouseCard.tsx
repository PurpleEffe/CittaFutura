import { Link } from 'react-router-dom';
import type { House } from '../types';

interface HouseCardProps {
  house: House;
}

function HouseImage({ title, src }: { title: string; src?: string }) {
  if (!src) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 via-secondary/30 to-accent/30 text-sm font-medium text-primary">
        {title}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`Foto della casa ${title}`}
      className="h-40 w-full rounded-xl object-cover"
      loading="lazy"
    />
  );
}

export function HouseCard({ house }: HouseCardProps) {
  const cover = house.photos[0];

  return (
    <article className="card card-compact bg-base-100 shadow-xl">
      <figure className="px-4 pt-4">
        <HouseImage title={house.title} src={cover} />
      </figure>
      <div className="card-body">
        <div className="flex items-start justify-between gap-2">
          <h3 className="card-title text-xl">{house.title}</h3>
          <span className="badge badge-outline">{house.capacity} posti</span>
        </div>
        {house.summary && <p className="text-base-content/70">{house.summary}</p>}
        {house.services.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {house.services.map((service) => (
              <span key={service} className="badge badge-primary badge-outline">
                {service}
              </span>
            ))}
          </div>
        )}
        <div className="card-actions mt-4 justify-end gap-2">
          <Link to={`/case/${house.slug}`} className="btn btn-sm btn-outline">
            Dettagli
          </Link>
          <Link to={`/prenota/${house.slug}`} className="btn btn-sm btn-primary">
            Richiedi
          </Link>
        </div>
      </div>
    </article>
  );
}
