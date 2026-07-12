import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'bookings.json');

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
if (!existsSync(DATA_FILE)) writeFileSync(DATA_FILE, '[]', 'utf-8');

// Very small write queue so two near-simultaneous requests can't both
// read the "old" file and each think a slot is free (classic race condition).
let writeChain = Promise.resolve();

function readBookings() {
  const raw = readFileSync(DATA_FILE, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function persist(bookings) {
  writeFileSync(DATA_FILE, JSON.stringify(bookings, null, 2), 'utf-8');
}

// Runs `mutator` exclusively — no other booking write can interleave.
function withLock(mutator) {
  const result = writeChain.then(() => {
    const bookings = readBookings();
    const output = mutator(bookings);
    persist(bookings);
    return output;
  });
  // Keep the chain alive even if this call fails, so future calls still run.
  writeChain = result.catch(() => {});
  return result;
}

export function getBookingsForDate(date) {
  return readBookings().filter((b) => b.date === date && b.status !== 'cancelled');
}

// Time slots have unlimited capacity — this is kept only for callers that
// want to know how many people have already picked a given slot.
export function isSlotTaken(date, time) {
  return getBookingsForDate(date).some((b) => b.time === time);
}

// Inserts the booking. Slots have no capacity cap, so any number of people
// can book the same date/time and this always succeeds. The write lock is
// kept so concurrent writes to the JSON file never clobber each other.
export async function createBooking(booking) {
  return withLock((bookings) => {
    const record = {
      id: `bk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...booking,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };
    bookings.push(record);
    return { ok: true, booking: record };
  });
}

export function getAllBookings() {
  return readBookings();
}
