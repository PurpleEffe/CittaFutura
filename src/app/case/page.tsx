import type { Metadata } from "next";
import Link from "next/link";
import { getHouses } from "@/lib/data";

export const metadata: Metadata = {
  title: "Case e residenze · Città Futura",
  description:
    "Schede descrittive bilingue delle residenze di Città Futura con servizi e dotazioni.",
};

export default async function CasePage() {
  const houses = await getHouses();

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-12">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Catalogo residenze</p>
        <h1 className="text-3xl font-semibold text-slate-900">Spazi disponibili</h1>
        <p className="text-sm text-slate-600">
          Schede descrittive bilingue con servizi, capacità e dotazioni per programmare attività residenziali e percorsi
          comunitari.
        </p>
      </header>
      <div className="space-y-12">
        {houses.map((house) => (
          <article key={house.id} className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[2fr_3fr]">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900">{house.name.it}</h2>
              <p className="text-sm text-slate-600">{house.name.en}</p>
              <p className="text-sm text-slate-700">{house.description.it}</p>
              <Link
                href={`/case/${house.slug}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 underline-offset-2 hover:underline"
              >
                Vai alla scheda completa
              </Link>
            </div>
            <div className="space-y-4 rounded-2xl bg-slate-50 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Services</h3>
              <div className="grid gap-2 text-sm text-slate-700">
                <div>
                  <p className="font-semibold">Italiano</p>
                  <ul className="list-disc space-y-1 pl-4">
                    {house.services.it.map((service) => (
                      <li key={service}>{service}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold">English</p>
                  <ul className="list-disc space-y-1 pl-4">
                    {house.services.en.map((service) => (
                      <li key={service}>{service}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="grid gap-2 text-sm text-slate-700">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dotazioni principali</h4>
                <ul className="list-disc space-y-1 pl-4">
                  {house.amenities.map((amenity) => (
                    <li key={amenity}>{amenity}</li>
                  ))}
                </ul>
              </div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {house.capacity.maxGuests} ospiti · {house.capacity.beds} posti letto · {house.address}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
