export type LocaleText = {
  it: string;
  en: string;
};

export interface House {
  id: string;
  slug: string;
  name: LocaleText;
  shortDescription: LocaleText;
  description: LocaleText;
  address: string;
  capacity: {
    beds: number;
    maxGuests: number;
  };
  amenities: string[];
  services: {
    it: string[];
    en: string[];
  };
  heroImage: string;
  gallery: string[];
}

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface BookingRecord {
  issueNumber: number;
  issueUrl: string;
  status: BookingStatus;
  state: "open" | "closed";
  stateReason?: "completed" | "not_planned" | null;
  guestName: string;
  guestEmail: string;
  guests: number;
  arrival: string;
  departure: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  language?: string;
}

export interface HouseBookingsFile {
  houseId: string;
  bookings: BookingRecord[];
  generatedAt: string;
}

export interface BookingFormPayload {
  houseId: string;
  guestName: string;
  guestEmail: string;
  guests: number;
  arrival: string;
  departure: string;
  notes?: string;
  language: "it" | "en";
  privacyAccepted: boolean;
}
