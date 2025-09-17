import type { Metadata } from "next";
import { getAllBookings, getHouses } from "@/lib/data";
import type { BookingRecord, HouseBookingsFile } from "@/lib/types";

export const metadata: Metadata = {
  title: "Amministrazione prenotazioni · Città Futura",
  description:
    "Panoramica in sola lettura delle richieste di prenotazione sincronizzate dal portale Città Futura.",
};

export default async function AdminPage() {
  const [houses, bookings] = await Promise.all([getHouses(), getAllBookings()]);
  const housesById = new Map(houses.map((house) => [house.id, house]));

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-12">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-slate-500">Area pubblica</p>
        <h1 className="text-3xl font-semibold text-slate-900">Stato prenotazioni</h1>
        <p className="text-sm text-slate-600">
          Questa sezione espone i dati generati automaticamente dall’automazione <code>sync-bookings</code>. Ogni scheda riporta
          le richieste presenti su GitHub Issues, con link diretto per la gestione.
        </p>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Linee guida</h2>
        <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
          <p>
            • Aggiungere l’etichetta <span className="rounded-full bg-slate-100 px-2 py-0.5">booking</span> alle issue per
            attivare la sincronizzazione. Il workflow aggiorna file JSON e calendari ICS.
          </p>
          <p>
            • Chiusura con motivo <em>completed</em> = prenotazione confermata. Motivo <em>not planned</em> = richiesta annullata.
            Gli stati sono visibili nel calendario e nella tabella sottostante.
          </p>
          <p>
            • I calendari ICS sono disponibili nella cartella <code>public/ics</code> e possono essere sottoscritti da partner e
            staff interno.
          </p>
          <p>
            • Aggiornare le schede informative su GitHub garantisce coerenza tra portale pubblico e gestione interna.
          </p>
        </div>
      </section>

      <div className="space-y-8">
        {bookings.length === 0 ? (
          <p className="text-sm text-slate-600">Nessun dato disponibile.</p>
        ) : (
          bookings.map((bookingFile) => (
            <HouseBookingCard
              key={bookingFile.houseId}
              bookingFile={bookingFile}
              houseName={housesById.get(bookingFile.houseId)?.name.it ?? bookingFile.houseId}
            />
          ))
        )}
      </div>
    </div>
  );
}

function HouseBookingCard({
  bookingFile,
  houseName,
}: {
  bookingFile: HouseBookingsFile;
  houseName: string;
}) {
  const confirmed = bookingFile.bookings.filter((booking) => booking.status === "confirmed").length;
  const pending = bookingFile.bookings.filter((booking) => booking.status === "pending").length;
  const cancelled = bookingFile.bookings.filter((booking) => booking.status === "cancelled").length;

  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{houseName}</h2>
          <p className="text-xs uppercase tracking-wide text-slate-500">{bookingFile.houseId}</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs uppercase tracking-wide text-slate-500">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Confermate {confirmed}</span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">In valutazione {pending}</span>
          <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">Non confermate {cancelled}</span>
        </div>
      </header>
      <div className="mt-4 text-xs text-slate-500">
        Ultimo aggiornamento: {new Date(bookingFile.generatedAt).toLocaleString("it-IT")}
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-white text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Organizzazione</th>
              <th className="px-3 py-2">Periodo</th>
              <th className="px-3 py-2">Partecipanti</th>
              <th className="px-3 py-2">Stato</th>
              <th className="px-3 py-2">Issue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {bookingFile.bookings.map((booking) => (
              <tr key={booking.issueNumber}>
                <td className="px-3 py-2">
                  <div className="font-semibold text-slate-900">{booking.guestName}</div>
                  <div className="text-xs text-slate-500">{booking.guestEmail}</div>
                </td>
                <td className="px-3 py-2">{formatRange(booking)}</td>
                <td className="px-3 py-2">{booking.guests}</td>
                <td className="px-3 py-2">{formatStatus(booking)}</td>
                <td className="px-3 py-2">
                  <a
                    className="text-slate-900 underline-offset-2 hover:underline"
                    href={booking.issueUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    #{booking.issueNumber}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
        <a
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white"
          href={`/ics/${bookingFile.houseId}.ics`}
        >
          Scarica calendario ICS
        </a>
        <a
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white"
          href={`/data/bookings/${bookingFile.houseId}.json`}
        >
          JSON sincronizzato
        </a>
      </div>
    </section>
  );
}

function formatRange(booking: BookingRecord) {
  const start = new Date(booking.arrival).toLocaleDateString("it-IT");
  const end = new Date(booking.departure).toLocaleDateString("it-IT");
  return `${start} → ${end}`;
}

function formatStatus(booking: BookingRecord) {
  if (booking.status === "confirmed") {
    return "Confermata";
  }
  if (booking.status === "pending") {
    return "In valutazione";
  }
  if (booking.status === "cancelled") {
    return "Non confermata";
  }
  return booking.status;
}
