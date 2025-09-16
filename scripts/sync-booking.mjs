import { readFile, writeFile, mkdir, readdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const eventPath = process.env.GITHUB_EVENT_PATH;
if (!eventPath) {
  console.error("GITHUB_EVENT_PATH non definito");
  process.exit(1);
}

const event = JSON.parse(await readFile(eventPath, "utf-8"));
const issue = event.issue;

if (!issue) {
  console.log("Nessuna issue nel payload, nulla da fare.");
  process.exit(0);
}

if (!hasBookingLabel(issue)) {
  console.log("Issue senza etichetta booking, esco.");
  process.exit(0);
}

const parsed = parseIssueBody(issue.body ?? "");
if (!parsed) {
  console.log("Corpo issue non contiene JSON valido, esco.");
  process.exit(0);
}

const bookingRecord = buildBookingRecord(issue, parsed);

const repoRoot = process.cwd();
const dataDir = path.join(repoRoot, "data", "bookings");
const publicDataDir = path.join(repoRoot, "public", "data", "bookings");
const icsDir = path.join(repoRoot, "public", "ics");

await mkdir(dataDir, { recursive: true });
await mkdir(publicDataDir, { recursive: true });
await mkdir(icsDir, { recursive: true });

await removeBookingFromOtherFiles({
  issueNumber: bookingRecord.issueNumber,
  dataDir,
  publicDataDir,
  icsDir,
});

await upsertBookingFile({
  record: bookingRecord,
  dataDir,
  publicDataDir,
  icsDir,
});

console.log(`Prenotazione #${bookingRecord.issueNumber} sincronizzata.`);

function hasBookingLabel(issue) {
  if (!Array.isArray(issue.labels)) return false;
  return issue.labels.some((label) => {
    if (typeof label === "string") {
      return label.toLowerCase() === "booking";
    }
    return (label?.name ?? "").toLowerCase() === "booking";
  });
}

function parseIssueBody(body) {
  const match = body.match(/```json\n([\s\S]+?)```/i);
  if (!match) {
    return null;
  }
  try {
    return JSON.parse(match[1]);
  } catch (error) {
    console.warn("Errore nel parsing del JSON", error);
    return null;
  }
}

function buildBookingRecord(issue, payload) {
  const status = deriveStatus(issue);
  const guests = Number(payload.guests ?? 0);
  return {
    houseId: payload.houseId,
    issueNumber: issue.number,
    issueUrl: issue.html_url,
    status,
    state: issue.state,
    stateReason: issue.state_reason ?? null,
    guestName: payload.guestName,
    guestEmail: payload.guestEmail,
    guests,
    arrival: payload.arrival,
    departure: payload.departure,
    notes: payload.notes ?? "",
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    language: payload.language ?? "it",
  };
}

function deriveStatus(issue) {
  if (issue.state === "closed") {
    if (issue.state_reason === "completed") {
      return "confirmed";
    }
    return "cancelled";
  }
  return "pending";
}

async function removeBookingFromOtherFiles({ issueNumber, dataDir, publicDataDir, icsDir }) {
  const files = await readdir(dataDir);
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const filePath = path.join(dataDir, file);
    const content = JSON.parse(await readFile(filePath, "utf-8"));
    const originalLength = content.bookings?.length ?? 0;
    if (!Array.isArray(content.bookings)) continue;
    const filtered = content.bookings.filter((booking) => booking.issueNumber !== issueNumber);
    if (filtered.length !== originalLength) {
      const updated = {
        ...content,
        bookings: filtered,
        generatedAt: new Date().toISOString(),
      };
      await writeFile(filePath, JSON.stringify(updated, null, 2));
      const publicPath = path.join(publicDataDir, file);
      await writeFile(publicPath, JSON.stringify(updated, null, 2));
      const houseId = file.replace(/\.json$/, "");
      await writeHouseIcs(path.join(icsDir, `${houseId}.ics`), filtered, houseId);
    }
  }
}

async function upsertBookingFile({ record, dataDir, publicDataDir, icsDir }) {
  const fileName = `${record.houseId}.json`;
  const filePath = path.join(dataDir, fileName);
  let content = { houseId: record.houseId, bookings: [], generatedAt: new Date().toISOString() };

  if (existsSync(filePath)) {
    content = JSON.parse(await readFile(filePath, "utf-8"));
  }

  const bookings = Array.isArray(content.bookings) ? [...content.bookings] : [];
  const index = bookings.findIndex((booking) => booking.issueNumber === record.issueNumber);
  if (index >= 0) {
    bookings[index] = record;
  } else {
    bookings.push(record);
  }

  bookings.sort((a, b) => a.arrival.localeCompare(b.arrival));

  const updated = {
    houseId: record.houseId,
    bookings,
    generatedAt: new Date().toISOString(),
  };

  await writeFile(filePath, JSON.stringify(updated, null, 2));
  const publicPath = path.join(publicDataDir, fileName);
  await writeFile(publicPath, JSON.stringify(updated, null, 2));
  await writeHouseIcs(path.join(icsDir, `${record.houseId}.ics`), bookings, record.houseId);
}

async function writeHouseIcs(filePath, bookings, houseId) {
  const confirmed = bookings.filter((booking) => booking.status === "confirmed");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Citta Futura//Calendario Prenotazioni//IT",
    "CALSCALE:GREGORIAN",
  ];

  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "");

  for (const booking of confirmed) {
    const dtStart = booking.arrival.replaceAll("-", "");
    const dtEnd = booking.departure.replaceAll("-", "");
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${houseId}-${booking.issueNumber}@cittafutura`);
    lines.push(`DTSTAMP:${stamp}Z`);
    lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
    lines.push(`DTEND;VALUE=DATE:${dtEnd}`);
    lines.push(`SUMMARY:${escapeText(`${houseId} prenotata`)}`);
    lines.push(
      `DESCRIPTION:${escapeText(`${booking.guestName} (${booking.guests} ospiti)\\nIssue #${booking.issueNumber}`)}`,
    );
    lines.push(`URL:${booking.issueUrl}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  await writeFile(filePath, lines.join("\n"));
}

function escapeText(value) {
  return String(value).replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}
