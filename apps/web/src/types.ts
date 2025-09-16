export type Role = 'USER' | 'GESTORE' | 'ADMIN';

export type BookingStatus =
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: string;
}

export interface House {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  capacity: number;
  services: string[];
  photos: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  houseId: string;
  startDate: string;
  endDate: string;
  people: number;
  notes?: string | null;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  house?: House;
}

export interface CalendarEvent {
  id: string;
  type: 'booking' | 'blackout';
  startDate: string;
  endDate: string;
  title: string;
  notes?: string;
}
