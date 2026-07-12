import nodemailer from 'nodemailer';

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: process.env.SMTP_SECURE !== 'false',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendMail({ to, subject, text, html, replyTo }) {
  const t = getTransporter();
  return t.sendMail({
    from: `"Kinesio Home Rehab" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
    replyTo,
  });
}

export async function sendBookingEmails(booking) {
  const admin = process.env.ADMIN_EMAIL;

  const detailsText = [
    `Name: ${booking.name}`,
    `Phone: ${booking.phone}`,
    `Email: ${booking.email || '—'}`,
    `Address: ${booking.address || '—'}`,
    `Service: ${booking.service}`,
    `Date: ${booking.date}`,
    `Time: ${booking.time}`,
    `Notes: ${booking.notes || '—'}`,
  ].join('\n');

  // Notify the clinic
  await sendMail({
    to: admin,
    subject: `New appointment request — ${booking.name} (${booking.date} ${booking.time})`,
    text: detailsText,
    replyTo: booking.email || undefined,
  });

  // Confirm to the patient, if they gave an email
  if (booking.email) {
    await sendMail({
      to: booking.email,
      subject: 'Your appointment request — Kinesio Home Rehab',
      text: `Hi ${booking.name},\n\nWe've received your appointment request for ${booking.date} at ${booking.time}. Our care coordinator will call you at ${booking.phone} within 30 minutes to confirm.\n\n${detailsText}\n\n— Kinesio Home Rehab`,
    });
  }
}

export async function sendContactEmail({ name, email, address, message }) {
  const admin = process.env.ADMIN_EMAIL;
  await sendMail({
    to: admin,
    subject: `New message from ${name} — Kinesio Home Rehab website`,
    text: `From: ${name} <${email}>\nAddress: ${address || '—'}\n\n${message}`,
    replyTo: email,
  });
}
