"use server";

import nodemailer from "nodemailer";
import { GMAIL_USER, GMAIL_APP_PASSWORD, isEmailConfigured } from "./config";

type Result = { ok: true; sent: number } | { ok: false; error: string };

function stampUTC(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function esc(s: string): string {
  return s.replace(/([,;\\])/g, "\\$1").replace(/\r?\n/g, "\\n");
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Envía por correo una invitación de cita a todos los destinatarios,
 * con la invitación de calendario incluida (método REQUEST).
 */
export async function sendAppointmentEmail(input: {
  to: string[];
  subject: string;
  message: string;
  title: string;
  startISO: string;
  durationMinutes: number;
  location?: string;
}): Promise<Result> {
  if (!isEmailConfigured) {
    return { ok: false, error: "El correo todavía no está configurado en la plataforma." };
  }
  const recipients = Array.from(new Set(input.to.filter(Boolean)));
  if (recipients.length === 0) {
    return { ok: false, error: "No hay destinatarios con correo válido." };
  }

  const start = new Date(input.startISO);
  const end = new Date(start.getTime() + input.durationMinutes * 60000);
  const uid = `${crypto.randomUUID()}@arkanreformas`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ARKAN Reformas//Plataforma//ES",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stampUTC(new Date())}`,
    `DTSTART:${stampUTC(start)}`,
    `DTEND:${stampUTC(end)}`,
    `SUMMARY:${esc(input.title)}`,
    `DESCRIPTION:${esc(input.message)}`,
    `LOCATION:${esc(input.location ?? "")}`,
    `ORGANIZER;CN=ARKAN Reformas:mailto:${GMAIL_USER}`,
    ...recipients.map((r) => `ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:${r}`),
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });

    await transporter.sendMail({
      from: `ARKAN Reformas <${GMAIL_USER}>`,
      to: recipients,
      subject: input.subject,
      text: input.message,
      html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0f172a;white-space:pre-wrap">${escHtml(
        input.message,
      )}</div>`,
      icalEvent: { method: "REQUEST", filename: "cita.ics", content: ics },
    });

    return { ok: true, sent: recipients.length };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error
          ? e.message
          : "No se pudo enviar el correo. Revisa la contraseña de aplicación.",
    };
  }
}
