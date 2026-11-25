import type { Config, Context } from "@netlify/functions";
import { json, preflight } from "./_lib/http";
import { resolveTenant } from "./_lib/tenant";
import { verifyToken } from "./_lib/token";
import { buildEmail, type Feedback } from "./_lib/email";
import { mailConfigured, sendMail } from "./_lib/mailer";

const MAX_BODY = 5 * 1024 * 1024; // keep under Netlify's 6 MB payload cap
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

function parse(raw: any): Feedback | null {
  if (!raw || typeof raw !== "object") return null;
  const comment = str(raw.comment, 5000).trim();
  if (!comment) return null;
  const shot = str(raw.screenshot, MAX_BODY);
  const m = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(shot);
  return {
    siteName: str(raw.siteName, 200),
    siteKey: str(raw.siteKey, 100),
    comment,
    type: str(raw.type, 40) || "Other",
    priority: str(raw.priority, 40) || "Normal",
    author: str(raw.author, 120),
    mode: raw.mode === "text" ? "text" : "element",
    url: str(raw.url, 2000),
    title: str(raw.title, 300),
    viewport: {
      width: Number(raw.viewport?.width) || 0,
      height: Number(raw.viewport?.height) || 0,
      device: str(raw.viewport?.device, 20),
    },
    selector: str(raw.selector, 1500),
    xpath: str(raw.xpath, 1500),
    tag: str(raw.tag, 40),
    originalText: str(raw.originalText, 4000),
    originalSrc: str(raw.originalSrc, 2000),
    userAgent: str(raw.userAgent, 400),
    screenshot: m ? { mime: `image/${m[1]}`, base64: m[2] } : null,
  };
}

// POST /api/submit-feedback   Authorization: Bearer <token from /api/auth>
export default async (req: Request, _ctx: Context) => {
  const early = preflight(req);
  if (early) return early;

  const text = await req.text();
  if (text.length > MAX_BODY) return json(req, { error: "Payload too large" }, 413);
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return json(req, { error: "Invalid JSON" }, 400); }

  const fb = parse(raw);
  if (!fb) return json(req, { error: "A comment is required" }, 400);

  const tenant = resolveTenant(fb.siteKey || undefined);
  const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!verifyToken(bearer, tenant.tokenSecret)) return json(req, { error: "Unauthorized" }, 401);
  if (!mailConfigured(tenant)) {
    return json(req, { error: "Email is not configured on the server (ADMIN_EMAIL + GMAIL_USER/GMAIL_APP_PASSWORD or RESEND_API_KEY)" }, 500);
  }

  try {
    await sendMail(tenant, buildEmail(fb, tenant.siteName));
  } catch (err) {
    console.error("Mail send failed:", err);
    return json(req, { error: "Could not send email" }, 502);
  }
  return json(req, { ok: true });
};

export const config: Config = {
  path: "/api/submit-feedback",
  rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
