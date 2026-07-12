import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bookingsRouter from './routes/bookings.js';
import contactRouter from './routes/contact.js';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5000')
  .split(',')
  .map((o) => o.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/bookings', bookingsRouter);
app.use('/api/contact', contactRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Kinesio backend listening on http://localhost:${PORT}`);
});
