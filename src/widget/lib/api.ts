import type { FeedbackPayload, WidgetConfig } from "./types";

const TOKEN_KEY = "opinonion:token";
export const ACTIVE_KEY = "opinonion:on"; // read by loader.js to auto-reload the widget on next pages

export function getConfig(): WidgetConfig {
  const c = ((window as any).__OPINONION__ || {}) as Partial<WidgetConfig>;
  return {
    host: c.host || new URL(import.meta.url).origin,
    site: c.site || "",
    siteKey: c.siteKey || "",
  };
}

export function loadToken(): string | null {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const { token, expiresAt } = JSON.parse(raw);
    if (typeof token === "string" && expiresAt > Date.now()) return token;
    sessionStorage.removeItem(TOKEN_KEY);
  } catch { /* storage unavailable */ }
  return null;
}

export function saveToken(token: string | null, expiresAt = 0) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ token, expiresAt }));
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch { /* ignore */ }
}

export function setActiveFlag(on: boolean) {
  try { on ? sessionStorage.setItem(ACTIVE_KEY, "1") : sessionStorage.removeItem(ACTIVE_KEY); } catch { /* ignore */ }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function post<T>(cfg: WidgetConfig, path: string, body: unknown, token?: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(cfg.host + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Network error — check your connection and try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as any).error || `Request failed (${res.status})`);
  return data as T;
}

export const authenticate = (cfg: WidgetConfig, password: string) =>
  post<{ token: string; expiresAt: number }>(cfg, "/api/auth", { password, siteKey: cfg.siteKey });

export const sendFeedback = (cfg: WidgetConfig, token: string, payload: FeedbackPayload) =>
  post<{ ok: true }>(cfg, "/api/submit-feedback", payload, token);
