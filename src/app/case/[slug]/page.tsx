import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BookingCalendar } from "@/components/BookingCalendar";
import { BookingForm } from "@/components/BookingForm";
import { getBookingsForHouse, getHouseBySlug, getHouses } from "@/lib/data";
import type { BookingRecord, House } from "@/lib/types";

interface HouseDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const houses = await getHouses();
  return houses.map((house) => ({ slug: house.slug }));
}

export async function generateMetadata({ params }: HouseDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const house = await getHouseBySlug(slug);
  if (!house) {
    return {
      title: "Scheda residenza",
    };
  }
  return {
    title: `${house.name.it} · Città Futura`,
    description: house.shortDescription.it,
  };
}

export default async function HouseDetailPage({ params }: HouseDetailPageProps) {
  const { slug } = await params;
  const house = await getHouseBySlug(slug);

  if (!house) {
    notFound();
  }

  const bookingData = await getBookingsForHouse(house.id);

  return (
    <div className="bg-gradient-to-b from-slate-50 via-white to-white">
      <div className="relative h-80 w-full overflow-hidden">
        <Image
          src={house.heroImage}
          alt={house.name.it}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-slate-950/60" />
        <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col justify-end px-4 pb-12 text-white">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-200">Residenza Città Futura</p>
          <h1 className="text-4xl font-semibold">{house.name.it}</h1>
          <p className="text-base text-slate-200">{house.name.en}</p>
          <p className="mt-3 max-w-2xl text-sm text-slate-100">{house.shortDescription.it}</p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-12 px-4 py-12">
        <section className="grid gap-10 md:grid-cols-[2fr_3fr]">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-slate-900">Profilo della casa</h2>
            <p className="text-sm text-slate-700">{house.description.it}</p>
            <p className="text-sm text-slate-500">{house.description.en}</p>
            <div className="rounded-2xl bg-slate-50 p-6">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dotazioni principali</h3>
              <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-slate-700">
                {house.amenities.map((amenity) => (
                  <li key={amenity}>{amenity}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 p-6">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Servizi curatoriali e logistici
              </h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Italiano</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-700">
                    {house.services.it.map((service) => (
                      <li key={service}>{service}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">English</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-700">
                    {house.services.en.map((service) => (
                      <li key={service}>{service}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <dl className="grid gap-2 text-sm text-slate-600">
              <div className="flex flex-wrap gap-2">
                <dt className="font-semibold uppercase tracking-wide text-slate-500">Indirizzo</dt>
                <dd>{house.address}</dd>
              </div>
              <div className="flex flex-wrap gap-2">
                <dt className="font-semibold uppercase tracking-wide text-slate-500">Capienza</dt>
                <dd>
                  {house.capacity.maxGuests} ospiti · {house.capacity.beds} posti letto
                </dd>
              </div>
              <div className="flex flex-wrap gap-2">
                <dt className="font-semibold uppercase tracking-wide text-slate-500">Contatti</dt>
                <dd>
                  <a className="underline-offset-2 hover:underline" href="mailto:ospitalita@cittafutura.example">
                    ospitalita@cittafutura.example
                  </a>
                </dd>
              </div>
            </dl>
          </div>
          <div className="space-y-6">
            <BookingCalendar bookings={bookingData.bookings} />
            <BookingForm houseId={house.id} />
            <RecentBookings bookings={bookingData.bookings} house={house} />
          </div>
        </section>
      </div>
    </div>
  );
}

function RecentBookings({
  bookings,
  house,
}: {
  bookings: BookingRecord[];
  house: House;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <h3 className="text-sm font-semibold text-slate-800">
        Richieste recenti · {house.name.it}
      </h3>
      <ul className="mt-4 space-y-3 text-sm text-slate-600">
        {bookings.length === 0 ? (
          <li>Nessuna richiesta registrata.</li>
        ) : (
          bookings.map((booking) => (
            <li key={booking.issueNumber} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="font-semibold text-slate-900">
                {booking.guestName} · {booking.guests} ospiti
              </p>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {new Date(booking.arrival).toLocaleDateString("it-IT")}
                {" → "}
                {new Date(booking.departure).toLocaleDateString("it-IT")}
              </p>
              <p className="text-xs text-slate-500">
                Stato: {formatStatus(booking)} ·{" "}
                <a
                  className="underline-offset-2 hover:underline"
                  href={booking.issueUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Issue #{booking.issueNumber}
                </a>
              </p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

function formatStatus(booking: BookingRecord) {
  if (booking.status === "confirmed") {
    return "confermata";
  }
  if (booking.status === "pending") {
    return "in valutazione";
  }
  if (booking.status === "cancelled") {
    return "non confermata";
  }
  return booking.status;
}
