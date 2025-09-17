import { promises as fs } from "fs";
import path from "path";
import type { BookingRecord, House, HouseBookingsFile } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const BOOKING_DIR = path.join(DATA_DIR, "bookings");

async function readJsonFile<T>(filePath: string): Promise<T> {
  const data = await fs.readFile(filePath, "utf-8");
  return JSON.parse(data) as T;
}

export async function getHouses(): Promise<House[]> {
  const housesPath = path.join(DATA_DIR, "houses.json");
  return readJsonFile<House[]>(housesPath);
}

export async function getHouseBySlug(slug: string): Promise<House | undefined> {
  const houses = await getHouses();
  return houses.find((house) => house.slug === slug);
}

export async function getBookingsForHouse(
  houseId: string,
): Promise<HouseBookingsFile> {
  const filePath = path.join(BOOKING_DIR, `${houseId}.json`);
  try {
    const data = await readJsonFile<HouseBookingsFile>(filePath);
    return {
      ...data,
      bookings: sortBookings(data.bookings),
    };
  } catch {
    return {
      houseId,
      bookings: [],
      generatedAt: new Date().toISOString(),
    };
  }
}

export async function getAllBookings(): Promise<HouseBookingsFile[]> {
  try {
    const files = await fs.readdir(BOOKING_DIR);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));
    const payloads = await Promise.all(
      jsonFiles.map(async (file) => {
        const houseBooking = await readJsonFile<HouseBookingsFile>(
          path.join(BOOKING_DIR, file),
        );
        return {
          ...houseBooking,
          bookings: sortBookings(houseBooking.bookings),
        };
      }),
    );
    return payloads.sort((a, b) => a.houseId.localeCompare(b.houseId));
  } catch {
    return [];
  }
}

function sortBookings(bookings: BookingRecord[]): BookingRecord[] {
  return [...bookings].sort((a, b) => {
    return a.arrival.localeCompare(b.arrival);
  });
}
