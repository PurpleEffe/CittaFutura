import type { BookingStatus } from '../types';

const STATUS_STYLES: Record<BookingStatus, { label: string; className: string }> = {
  IN_REVIEW: { label: 'In revisione', className: 'badge-warning' },
  APPROVED: { label: 'Approvata', className: 'badge-primary' },
  REJECTED: { label: 'Rifiutata', className: 'badge-error' },
  CHECKED_IN: { label: 'Check-in', className: 'badge-info' },
  CHECKED_OUT: { label: 'Check-out', className: 'badge-neutral' },
  CANCELLED: { label: 'Annullata', className: 'badge-outline' },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const { label, className } = STATUS_STYLES[status];
  return <span className={`badge ${className}`}>{label}</span>;
}
