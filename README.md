# 🧅 OpinOnion

Zero-impact visual feedback widget. Embed one ~1 KB script on any site; nothing else loads until a reviewer triggers it.

## How it works
1. `loader.js` (<1 KB) listens for **Ctrl/Cmd + Shift + O** or `?opinonion=true`. Nothing else loads before that.
2. It injects `widget.js` (Preact + Tailwind, all inside a **Shadow DOM**, ~16 KB gz).
3. Reviewer enters the workspace password → `/api/auth` returns a signed 12 h token (kept in `sessionStorage`).
4. The screenshot library (`modern-screenshot`) is a separate chunk downloaded only after login.
5. **Select element** / **Highlight text** → comment popover → `/api/submit-feedback` → HTML email (Gmail SMTP or Resend).

## Embed
```html
<script src="https://YOUR-SITE.netlify.app/loader.js" async data-site="Client Site Name"></script>
```
Optional `data-key="tenant-id"` is sent to the API (multi-tenant seam: `netlify/functions/_lib/tenant.ts`).

## Environment variables (Netlify → Site configuration → Environment variables; scope must include **Functions**)
| Name | Required | Purpose |
|---|---|---|
| `SITE_PASSWORD` | yes | Password reviewers type in the modal |
| `ADMIN_EMAIL` | yes | Recipient of feedback emails |
| `GMAIL_USER` + `GMAIL_APP_PASSWORD` | yes, unless using Resend | Gmail SMTP sender (Google app password). Preferred when both transports are set |
| `RESEND_API_KEY` | alternative | Use Resend instead of Gmail |
| `FROM_EMAIL` | no | e.g. `OpinOnion <feedback@yourdomain.com>` (needs a domain verified in Resend; default `onboarding@resend.dev` only delivers to your own Resend account email) |
| `SITE_NAME` | no | Fallback site name if the embed has no `data-site` |
| `AUTH_SECRET` | no | HMAC key for tokens (defaults to one derived from `SITE_PASSWORD`) |
| `ALLOWED_ORIGINS` | no | Comma-separated allow-list of client origins; empty = any |

Redeploy after changing variables.

## Develop / deploy
```bash
npm install
npm run typecheck && npm run build     # -> dist/
npx netlify dev                        # full local run (needs .env, see .env.example)
# offline smoke test without Netlify CLI:
SITE_PASSWORD=x ADMIN_EMAIL=a@b.c RESEND_API_KEY=k MOCK_RESEND=1 npm run dev:local   # http://localhost:8888/demo.html
```
Deploy: push to Git and connect the repo in Netlify (`netlify.toml` has everything).

## Notes
- CORS: `netlify.toml` headers cover static files (`loader.js`, `widget.js`, chunks). **Function responses don't get toml headers**, so `/api/*` CORS + OPTIONS are handled in `_lib/http.ts`.
- `/api/auth` is rate-limited (10/min/IP) via function `config.rateLimit`.
- Ctrl/Cmd+Shift+O is also a browser bookmarks shortcut in some browsers; the page's `preventDefault` usually wins, otherwise use `?opinonion=true`.
- Screenshot limitation: `position:fixed` elements can be offset when the page is scrolled.
