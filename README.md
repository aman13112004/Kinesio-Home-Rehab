# Kinesio Backend

Small Express API that powers the website's two forms:

- `POST /api/contact` — sends the Contact page message to your email
- `POST /api/bookings` — creates an appointment, **rejecting it with a 409 if that date+time is already taken**
- `GET /api/bookings/availability?date=YYYY-MM-DD` — returns which slots are free/taken for a date (used by the frontend to grey out taken slots)
- `GET /api/bookings` — lists all bookings (for you to check manually / build an admin view later)

Bookings are stored in `backend/data/bookings.json`. No database server to install or manage — this is fine for a single-location clinic's booking volume. If you outgrow it later, swapping the storage layer in `db.js` for a real database (e.g. Postgres) is a contained change; the routes don't need to change.

## 1. Install dependencies

```bash
cd backend
npm install
```

## 2. Configure email sending

```bash
cp .env.example .env
```

Then edit `.env`:

- `ADMIN_EMAIL` — where booking/contact notifications should land (defaults to your clinic email)
- `SMTP_USER` / `SMTP_PASS` — credentials to actually send mail

**Easiest option — Gmail App Password:**
1. Go to your Google Account → Security → 2-Step Verification (turn it on if it isn't already)
2. Search "App passwords", create one named e.g. "Kinesio Website"
3. Copy the 16-character password into `SMTP_PASS`, and your Gmail address into `SMTP_USER`

Any other SMTP provider (Zoho Mail, SendGrid, Mailgun, etc.) works too — just fill in `SMTP_HOST`/`SMTP_PORT` accordingly.

## 3. Run it

```bash
npm run dev
```

Server starts on `http://localhost:5000` (change with `PORT` in `.env`).

## 4. Point the frontend at it

In `frontend/`, copy `.env.example` to `.env` — the default `http://localhost:5000` already matches step 3 for local development. For production, set `VITE_API_URL` to wherever you deploy this backend (e.g. Render, Railway, a VPS).

## Deploying

Any Node host works (Render, Railway, Fly.io, a basic VPS). Steps are the same everywhere:
1. Push this `backend/` folder
2. Set the same environment variables from `.env` in the host's dashboard
3. Set `CORS_ORIGIN` to your live site's URL (e.g. `https://kinesiohomerehab.in`)
4. Set the frontend's `VITE_API_URL` to the backend's live URL and rebuild the frontend

One thing to know: most free hosts use ephemeral or resettable disks, so `data/bookings.json` may not persist forever on a free tier. Fine for testing; for production, worth checking your host's disk persistence or migrating to a proper database once you're relying on this daily.
