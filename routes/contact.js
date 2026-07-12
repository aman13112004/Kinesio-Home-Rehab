import { Router } from 'express';
import { sendContactEmail } from '../utils/mailer.js';

const router = Router();

router.post('/', async (req, res) => {
  const { name, email, address, message } = req.body || {};

  if (!name || !email || !address || !message) {
    return res.status(400).json({ error: 'name, email, address and message are required' });
  }

  try {
    await sendContactEmail({ name, email, address, message });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Failed to send contact email:', err.message);
    res.status(502).json({ error: 'Could not send message right now. Please try again shortly.' });
  }
});

export default router;
