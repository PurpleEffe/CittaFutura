import dayjs from 'dayjs';
import type { CalendarEvent } from '../types';

interface AvailabilityCalendarProps {
  events: CalendarEvent[];
}

function getStatusColor(status: 'booking' | 'blackout' | 'available') {
  if (status === 'booking') return 'bg-primary/80 text-primary-content border-primary/40';
  if (status === 'blackout') return 'bg-warning/70 text-warning-content border-warning/40';
  return 'bg-base-100 text-base-content border-base-300';
}

export function AvailabilityCalendar({ events }: AvailabilityCalendarProps) {
  const firstOfMonth = dayjs().startOf('month');
  const calendarStart = firstOfMonth.subtract(firstOfMonth.day(), 'day');
  const totalDays = 42; // 6 settimane

  const dayStatus = new Map<string, 'booking' | 'blackout'>();

  events.forEach((event) => {
    const start = dayjs(event.startDate).startOf('day');
    const end = dayjs(event.endDate).startOf('day');
    for (let cursor = start; cursor.diff(end, 'day') <= 0; cursor = cursor.add(1, 'day')) {
      const key = cursor.format('YYYY-MM-DD');
      if (dayStatus.get(key) === 'booking') continue;
      if (event.type === 'booking') {
        dayStatus.set(key, 'booking');
      } else if (!dayStatus.has(key)) {
        dayStatus.set(key, 'blackout');
      }
    }
  });

  const weeks: dayjs.Dayjs[][] = [];
  for (let weekIndex = 0; weekIndex < totalDays / 7; weekIndex += 1) {
    const week: dayjs.Dayjs[] = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      week.push(calendarStart.add(weekIndex * 7 + dayIndex, 'day'));
    }
    weeks.push(week);
  }

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-2 text-center text-sm font-semibold text-base-content/70">
        {weekDays.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {weeks.flat().map((day) => {
          const key = day.format('YYYY-MM-DD');
          const status = dayStatus.get(key) ?? 'available';
          const isToday = dayjs().isSame(day, 'day');
          const isCurrentMonth = day.month() === firstOfMonth.month();

          return (
            <div
              key={key}
              className={`flex h-16 flex-col rounded-xl border p-2 text-xs transition ${getStatusColor(status)} ${
                isToday ? 'ring-2 ring-accent ring-offset-2 ring-offset-base-200' : ''
              } ${isCurrentMonth ? '' : 'opacity-50'}`}
              aria-label={`Giorno ${day.format('D MMMM YYYY')} - ${
                status === 'booking'
                  ? 'occupato'
                  : status === 'blackout'
                    ? 'non disponibile'
                    : 'libero'
              }`}
            >
              <span className="font-semibold">{day.date()}</span>
              <span className="mt-auto text-[0.65rem] uppercase tracking-wide">
                {status === 'booking' ? 'Pren.' : status === 'blackout' ? 'Blocco' : 'Libero'}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm text-base-content/70">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-6 rounded-full bg-primary/80" aria-hidden="true" />
          Prenotazione approvata
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-6 rounded-full bg-warning/70" aria-hidden="true" />
          Periodo di blackout
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-6 rounded-full bg-base-200" aria-hidden="true" />
          Disponibile
        </div>
      </div>
    </div>
  );
}
