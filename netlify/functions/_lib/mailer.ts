import nodemailer, { type Transporter } from "nodemailer";
import type { Tenant } from "./tenant";

export interface Mail {
  subject: string;
  html: string;
  text: string;
  attachments: { filename: string; content: string; content_id: string }[]; // base64 content
}

export type MailerConfig = Pick<Tenant, "adminEmail" | "fromEmail" | "gmailUser" | "gmailAppPassword" | "resendApiKey">;

export function mailConfigured(t: MailerConfig): boolean {
  return !!t.adminEmail && !!((t.gmailUser && t.gmailAppPassword) || t.resendApiKey);
}

/** Gmail SMTP when GMAIL_USER + GMAIL_APP_PASSWORD are set, otherwise Resend. Throws on failure. */
export async function sendMail(t: MailerConfig, mail: Mail, transport?: Transporter): Promise<void> {
  if (transport || (t.gmailUser && t.gmailAppPassword)) {
    const tx = transport ?? nodemailer.createTransport({ service: "gmail", auth: { user: t.gmailUser, pass: t.gmailAppPassword } });
    await tx.sendMail({
      from: t.fromEmail,
      to: t.adminEmail,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      attachments: mail.attachments.map((a) => ({ filename: a.filename, content: a.content, encoding: "base64", cid: a.content_id })),
    });
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${t.resendApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: t.fromEmail, to: [t.adminEmail], subject: mail.subject, html: mail.html, text: mail.text, attachments: mail.attachments }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text().catch(() => "")}`);
}
