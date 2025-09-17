"use client";

import { useId, useState } from "react";
import type { BookingFormPayload } from "@/lib/types";

interface BookingFormProps {
  houseId: string;
}

type FormState = "idle" | "loading" | "success" | "error";

const BOOKING_ENDPOINT = process.env.NEXT_PUBLIC_BOOKING_ENDPOINT;

export function BookingForm({ houseId }: BookingFormProps) {
  const formId = useId();
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setError(null);

    if (!BOOKING_ENDPOINT) {
      setState("error");
      setError(
        "Endpoint di prenotazione non configurato. Impostare NEXT_PUBLIC_BOOKING_ENDPOINT prima del deploy.",
      );
      return;
    }

    const formData = new FormData(event.currentTarget);
    const notesValue = formData.get("notes");
    const payload: BookingFormPayload = {
      houseId,
      guestName: String(formData.get("guestName") ?? ""),
      guestEmail: String(formData.get("guestEmail") ?? ""),
      guests: Number(formData.get("guests") ?? 0),
      arrival: String(formData.get("arrival") ?? ""),
      departure: String(formData.get("departure") ?? ""),
      notes: notesValue ? String(notesValue) : undefined,
      language: (String(formData.get("language") ?? "it") as "it" | "en"),
      privacyAccepted: formData.get("privacy") === "on",
    };

    if (new Date(payload.arrival) >= new Date(payload.departure)) {
      setState("error");
      setError("La data di partenza deve essere successiva alla data di arrivo.");
      return;
    }

    if (!Number.isFinite(payload.guests) || payload.guests <= 0) {
      setState("error");
      setError("Indicare il numero di partecipanti.");
      return;
    }

    if (!payload.privacyAccepted) {
      setState("error");
      setError("Per procedere è necessario accettare l’informativa privacy.");
      return;
    }

    try {
      const response = await fetch(BOOKING_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      setState("success");
      event.currentTarget.reset();
    } catch (submissionError) {
      console.error(submissionError);
      setState("error");
      setError(
        "Si è verificato un problema nell’invio. Riprovare più tardi o contattare ospitalita@cittafutura.example.",
      );
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Richiesta di prenotazione / Booking request
        </p>
        <h3 className="text-xl font-semibold text-slate-900">Invia proposta di utilizzo</h3>
        <p className="text-sm text-slate-600">
          Le richieste vengono valutate dallo staff di Città Futura. Riceverai una risposta via email.
        </p>
      </header>
      <form
        id={formId}
        className="grid gap-4"
        onSubmit={handleSubmit}
        aria-describedby={error ? `${formId}-error` : undefined}
      >
        <div className="grid gap-1">
          <label className="text-sm font-medium text-slate-700" htmlFor={`${formId}-guestName`}>
            Nome dell’organizzazione / Organisation name
          </label>
          <input
            id={`${formId}-guestName`}
            name="guestName"
            type="text"
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium text-slate-700" htmlFor={`${formId}-guestEmail`}>
            Email di contatto
          </label>
          <input
            id={`${formId}-guestEmail`}
            name="guestEmail"
            type="email"
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-1">
            <label className="text-sm font-medium text-slate-700" htmlFor={`${formId}-arrival`}>
              Arrivo (check-in)
            </label>
            <input
              id={`${formId}-arrival`}
              name="arrival"
              type="date"
              required
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium text-slate-700" htmlFor={`${formId}-departure`}>
              Partenza (check-out)
            </label>
            <input
              id={`${formId}-departure`}
              name="departure"
              type="date"
              required
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-1">
            <label className="text-sm font-medium text-slate-700" htmlFor={`${formId}-guests`}>
              Numero di partecipanti
            </label>
            <input
              id={`${formId}-guests`}
              name="guests"
              type="number"
              min={1}
              max={50}
              required
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium text-slate-700" htmlFor={`${formId}-language`}>
              Lingua di riferimento / Preferred language
            </label>
            <select
              id={`${formId}-language`}
              name="language"
              defaultValue="it"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="it">Italiano</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium text-slate-700" htmlFor={`${formId}-notes`}>
            Note aggiuntive / Additional notes
          </label>
          <textarea
            id={`${formId}-notes`}
            name="notes"
            rows={4}
            placeholder="Descrivi obiettivi, attività aperte al pubblico, esigenze tecniche"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <label className="flex items-start gap-3 text-sm text-slate-600">
          <input type="checkbox" name="privacy" className="mt-1" required />
          <span>
            Confermo di aver letto l’informativa sul trattamento dei dati personali e autorizzo il contatto da parte dello staff.
            <br />
            I authorise Città Futura staff to process the request and contact me back.
          </span>
        </label>

        {state === "success" ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Richiesta inviata correttamente. Riceverai una conferma via email.
          </p>
        ) : null}

        {error ? (
          <p
            id={`${formId}-error`}
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="mt-2 inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={state === "loading"}
        >
          {state === "loading" ? "Invio in corso..." : "Invia richiesta"}
        </button>
      </form>
    </section>
  );
}
