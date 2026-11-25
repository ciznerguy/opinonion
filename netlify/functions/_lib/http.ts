// Shared HTTP helpers. NOTE: netlify.toml [[headers]] do NOT apply to function
// responses, so CORS is implemented here, in code.

const BASE_HEADERS = {
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
};

/** Optional allow-list: ALLOWED_ORIGINS="https://a.com,https://b.com". Empty = any origin. */
export function originAllowed(req: Request): boolean {
  const list = (Netlify.env.get("ALLOWED_ORIGINS") || "")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
  if (!list.length) return true;
  const origin = req.headers.get("origin");
  return !!origin && list.includes(origin);
}

export function corsHeaders(req: Request): Record<string, string> {
  // Auth uses bearer tokens (no cookies), so reflecting the origin / "*" is safe.
  return { ...BASE_HEADERS, "Access-Control-Allow-Origin": req.headers.get("origin") || "*" };
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...corsHeaders(req) },
  });
}

/** Handles preflight + origin allow-list. Returns a Response if the request should stop here. */
export function preflight(req: Request): Response | null {
  if (!originAllowed(req)) return json(req, { error: "Origin not allowed" }, 403);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);
  return null;
}
