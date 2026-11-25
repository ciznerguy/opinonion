import type { Config, Context } from "@netlify/functions";
import { json, preflight } from "./_lib/http";
import { resolveTenant } from "./_lib/tenant";
import { issueToken, safeEqual } from "./_lib/token";

// POST /api/auth  { password, siteKey? }  ->  { token, expiresAt }
export default async (req: Request, _ctx: Context) => {
  const early = preflight(req);
  if (early) return early;

  let body: { password?: unknown; siteKey?: unknown };
  try { body = await req.json(); } catch { return json(req, { error: "Invalid JSON" }, 400); }

  const tenant = resolveTenant(typeof body.siteKey === "string" ? body.siteKey : undefined);
  if (!tenant.password) return json(req, { error: "SITE_PASSWORD is not configured on the server" }, 500);

  const given = typeof body.password === "string" ? body.password : "";
  if (!given || !safeEqual(given, tenant.password)) {
    await new Promise((r) => setTimeout(r, 400)); // slow down guessing
    return json(req, { error: "Wrong password" }, 401);
  }
  return json(req, issueToken(tenant.tokenSecret));
};

export const config: Config = {
  path: "/api/auth",
  // Brute-force protection: 10 attempts / minute / IP.
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
