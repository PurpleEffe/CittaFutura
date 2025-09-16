export type Role = 'USER' | 'GESTORE' | 'ADMIN';

export type BookingStatus =
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED';

export const BOOKING_STATUSES: BookingStatus[] = [
  'IN_REVIEW',
  'APPROVED',
  'REJECTED',
  'CHECKED_IN',
  'CHECKED_OUT',
  'CANCELLED',
];

