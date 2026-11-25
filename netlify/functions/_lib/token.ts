import { createHmac, timingSafeEqual } from "node:crypto";

const TTL_MS = 12 * 60 * 60 * 1000; // 12h

const b64u = (b: Buffer | string) => Buffer.from(b).toString("base64url");
const sign = (data: string, secret: string) => createHmac("sha256", secret).update(data).digest();

/** Constant-time string compare (hashes first so lengths never leak). */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHmac("sha256", "oo-cmp").update(a).digest();
  const hb = createHmac("sha256", "oo-cmp").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function issueToken(secret: string): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + TTL_MS;
  const payload = b64u(JSON.stringify({ exp: expiresAt }));
  return { token: `${payload}.${b64u(sign(payload, secret))}`, expiresAt };
}

export function verifyToken(token: string | null | undefined, secret: string): boolean {
  if (!token || !secret) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload, secret);
  let given: Buffer;
  try { given = Buffer.from(sig, "base64url"); } catch { return false; }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof exp === "number" && exp > Date.now();
  } catch { return false; }
}
