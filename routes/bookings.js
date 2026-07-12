import { Router } from 'express';
import { getBookingsForDate, createBooking, getAllBookings } from '../db.js';
import { sendBookingEmails } from '../utils/mailer.js';

const router = Router();

// 9:00 AM to 8:00 PM, 1-hour slots (last slot starts 7:00 PM, ends 8:00 PM).
// Slots have no booking cap — any number of people can request the same slot,
// so we never reject a request for "slot taken".
function buildSlots(startHour, endHour) {
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h > 12 ? h - 12 : h;
    slots.push(`${hour12}:00 ${period}`);
  }
  return slots;
}
const ALL_SLOTS = buildSlots(9, 20);

const FREE_CONSULTATION_SLUG = 'free-consultation';
const FREE_CONSULTATION_LEAD_DAYS = 2;

// yyyy-mm-dd for a date `days` from today (server-local time), used to
// enforce the free-consultation lead time server-side too.
function dateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// GET /api/bookings/availability?date=2026-07-10
// Slots are unlimited-capacity, so every slot is always "available"; this
// is kept only so the frontend can still show the full slot list per date.
router.get('/availability', (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date is required' });

  res.json({ date, allSlots: ALL_SLOTS, bookedTimes: [], availableTimes: ALL_SLOTS });
});

// POST /api/bookings
// Body: { name, phone, email, address, service, date, time, notes }
router.post('/', async (req, res) => {
  const { name, phone, email, address, service, date, time, notes } = req.body || {};

  if (!name || !phone || !address || !service || !date || !time) {
    return res.status(400).json({ error: 'name, phone, address, service, date and time are required' });
  }

  if (service === FREE_CONSULTATION_SLUG) {
    const minDate = dateOffset(FREE_CONSULTATION_LEAD_DAYS);
    if (date < minDate) {
      return res.status(400).json({
        error: `Free consultations can only be booked from ${minDate} onward.`,
        code: 'too_soon',
      });
    }
  }

  // Slots have no capacity limit, so this always succeeds.
  const result = await createBooking({ name, phone, email, address, service, date, time, notes });

  try {
    await sendBookingEmails(result.booking);
  } catch (err) {
    // Booking is already saved — email failure shouldn't undo that, but we
    // do want to know about it server-side.
    console.error('Failed to send booking emails:', err.message);
  }

  res.status(201).json({ booking: result.booking });
});

// GET /api/bookings — simple admin listing (protect this in production!)
router.get('/', (req, res) => {
  res.json({ bookings: getAllBookings() });
});

export default router;
