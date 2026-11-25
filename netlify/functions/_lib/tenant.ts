// Single seam for multi-tenancy. Today every setting comes from env vars (one
// workspace). To go SaaS, resolve the tenant from `siteKey` (DB / Blobs lookup)
// and return that tenant's password, admin email, branding and secret instead.

export interface Tenant {
  siteName: string;
  password: string;
  adminEmail: string;
  fromEmail: string;
  /** Mail transport option A: Gmail SMTP (app password). */
  gmailUser: string;
  gmailAppPassword: string;
  /** Mail transport option B: Resend. Used only when Gmail is not configured. */
  resendApiKey: string;
  /** HMAC key used to sign session tokens. */
  tokenSecret: string;
}

export function resolveTenant(_siteKey?: string): Tenant {
  const env = (k: string) => Netlify.env.get(k) || "";
  const password = env("SITE_PASSWORD");
  const gmailUser = env("GMAIL_USER");
  return {
    siteName: env("SITE_NAME"),
    password,
    adminEmail: env("ADMIN_EMAIL"),
    fromEmail: env("FROM_EMAIL") || (gmailUser ? `OpinOnion <${gmailUser}>` : "OpinOnion <onboarding@resend.dev>"),
    gmailUser,
    gmailAppPassword: env("GMAIL_APP_PASSWORD"),
    resendApiKey: env("RESEND_API_KEY"),
    tokenSecret: env("AUTH_SECRET") || (password ? `opinonion:${password}` : ""),
  };
}
