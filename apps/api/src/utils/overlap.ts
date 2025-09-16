import dayjs from 'dayjs';

export function rangesOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean {
  const aStart = dayjs(startA);
  const aEnd = dayjs(endA);
  const bStart = dayjs(startB);
  const bEnd = dayjs(endB);

  if (!aStart.isValid() || !aEnd.isValid() || !bStart.isValid() || !bEnd.isValid()) {
    return false;
  }

  return aStart.isBefore(bEnd) && bStart.isBefore(aEnd);
}

export function assertValidRange(startDate: Date, endDate: Date) {
  const start = dayjs(startDate);
  const end = dayjs(endDate);

  if (!start.isValid() || !end.isValid()) {
    throw new Error('Invalid date range');
  }

  if (!start.isBefore(end)) {
    throw new Error('The start date must be before the end date');
  }
}
