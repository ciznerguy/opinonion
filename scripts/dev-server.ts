// Offline smoke-test server (no Netlify CLI needed): serves dist/ and mounts the
// Netlify function handlers at their /api paths. Set MOCK_RESEND=1 to capture emails
// to .tmp-emails.json instead of calling Resend.
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

const PORT = Number(process.env.PORT || 8888);
(globalThis as any).Netlify = { env: { get: (k: string) => process.env[k] } };

if (process.env.MOCK_RESEND) {
  const real = globalThis.fetch;
  globalThis.fetch = (async (url: any, init?: any) => {
    if (String(url).startsWith("https://api.resend.com/")) {
      await writeFile(".tmp-emails.json", String(init.body));
      return new Response(JSON.stringify({ id: "mock" }), { status: 200 });
    }
    return real(url, init);
  }) as typeof fetch;
}

const routes: Record<string, () => Promise<any>> = {
  "/api/auth": () => import("../netlify/functions/auth"),
  "/api/submit-feedback": () => import("../netlify/functions/submit-feedback"),
};
const mime: Record<string, string> = { ".js": "text/javascript", ".html": "text/html", ".css": "text/css" };

createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const cors = { "Access-Control-Allow-Origin": "*", "Cross-Origin-Resource-Policy": "cross-origin" };

  if (routes[url.pathname]) {
    const mod = await routes[url.pathname]();
    const r: Response = await mod.default(
      new Request(url, { method: req.method, headers: req.headers as any, body: ["GET", "HEAD"].includes(req.method!) ? undefined : Buffer.concat(chunks) }),
      {},
    );
    res.writeHead(r.status, Object.fromEntries(r.headers));
    return res.end(Buffer.from(await r.arrayBuffer()));
  }
  try {
    const file = join("dist", url.pathname === "/" ? "index.html" : url.pathname);
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream", ...cors });
    res.end(body);
  } catch { res.writeHead(404, cors); res.end("Not found"); }
}).listen(PORT, () => console.log(`OpinOnion dev server: http://localhost:${PORT}/demo.html`));
