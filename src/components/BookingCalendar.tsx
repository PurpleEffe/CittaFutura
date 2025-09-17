"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isWithinInterval,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import { it as localeIt, enGB as localeEn } from "date-fns/locale";
import { useMemo, useState } from "react";
import type { BookingRecord } from "@/lib/types";

interface BookingCalendarProps {
  bookings: BookingRecord[];
}

export function BookingCalendar({ bookings }: BookingCalendarProps) {
  const today = startOfMonth(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(today);

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const monthLabelIt = useMemo(
    () => format(currentMonth, "MMMM yyyy", { locale: localeIt }),
    [currentMonth],
  );
  const monthLabelEn = useMemo(
    () => format(currentMonth, "MMMM yyyy", { locale: localeEn }),
    [currentMonth],
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Disponibilità / Availability
          </p>
          <h3 className="text-lg font-semibold text-slate-900">
            {monthLabelIt} · {monthLabelEn}
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCurrentMonth((month) => subMonths(month, 1))}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 transition hover:bg-white"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth((month) => addMonths(month, 1))}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 transition hover:bg-white"
          >
            →
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium uppercase text-slate-500">
        {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-2">
        {calendarDays.map((day) => {
          const dayLabel = format(day, "d");
          const booking = findBookingForDay(bookings, day);
          const statusClass = booking
            ? booking.status === "confirmed"
              ? "bg-emerald-100 border-emerald-300"
              : booking.status === "pending"
                ? "bg-amber-100 border-amber-300"
                : "bg-rose-100 border-rose-300"
            : "bg-white border-slate-200";
          const tooltip = booking
            ? `${booking.guestName} · ${formatRange(booking.arrival, booking.departure)} · #${booking.issueNumber}`
            : null;

          return (
            <div
              key={day.toISOString()}
              className={`relative flex min-h-[4rem] flex-col justify-center rounded-xl border text-center text-sm font-medium text-slate-700 shadow-sm transition`}
              title={tooltip ?? undefined}
            >
              <span className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full ${statusClass}`}>
                {dayLabel}
              </span>
              {booking ? (
                <span className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">
                  {booking.status === "confirmed"
                    ? "confermato"
                    : booking.status === "pending"
                      ? "in attesa"
                      : "non disponibile"}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
        <LegendSwatch className="bg-emerald-100 border border-emerald-300" label="Confermato" />
        <LegendSwatch className="bg-amber-100 border border-amber-300" label="In attesa di conferma" />
        <LegendSwatch className="bg-rose-100 border border-rose-300" label="Non disponibile" />
      </div>
    </section>
  );
}

function findBookingForDay(bookings: BookingRecord[], day: Date) {
  return bookings.find((booking) =>
    isWithinInterval(day, {
      start: new Date(booking.arrival),
      end: subDays(new Date(booking.departure), 1),
    }),
  );
}

function formatRange(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return `${format(startDate, "dd/MM")} → ${format(endDate, "dd/MM")}`;
}

function LegendSwatch({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-3 w-3 rounded-full ${className}`} aria-hidden />
      {label}
    </span>
  );
}
