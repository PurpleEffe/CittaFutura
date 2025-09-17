import Image from "next/image";
import Link from "next/link";
import type { House } from "@/lib/types";

interface HouseCardProps {
  house: House;
}

export function HouseCard({ house }: HouseCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative h-56 w-full">
        <Image
          src={house.heroImage}
          alt={house.name.it}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-slate-900">{house.name.it}</h3>
          <p className="text-sm text-slate-500">{house.name.en}</p>
        </div>
        <p className="text-sm text-slate-600">{house.shortDescription.it}</p>
        <div className="mt-auto flex items-center justify-between pt-3 text-xs uppercase tracking-wide text-slate-500">
          <span>{house.capacity.maxGuests} ospiti · {house.capacity.beds} posti letto</span>
          <Link
            href={`/case/${house.slug}`}
            className="rounded-full bg-slate-900 px-4 py-1 text-white transition hover:bg-slate-700"
          >
            Dettagli
          </Link>
        </div>
      </div>
    </article>
  );
}
