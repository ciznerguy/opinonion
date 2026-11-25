export interface Feedback {
  siteName: string; siteKey: string; comment: string; type: string; priority: string; author: string;
  mode: "element" | "text"; url: string; title: string;
  viewport: { width: number; height: number; device: string };
  selector: string; xpath: string; tag: string;
  originalText: string; originalSrc: string; userAgent: string;
  heading: string; before: string; after: string; scrollPct: number;
  screenshot: { mime: string; base64: string } | null;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const safeHttpUrl = (u: string) => (/^https?:\/\//i.test(u) ? u : "");
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

/** Chrome/Edge "scroll to text fragment" link: opens the page and highlights the text. */
function textFragmentUrl(url: string, text: string): string {
  if (!/^https?:\/\//i.test(url)) return "";
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return "";
  const enc = (s: string) => encodeURIComponent(s).replace(/-/g, "%2D");
  const frag = t.length > 100 ? `${enc(t.slice(0, 50).trim())},${enc(t.slice(-50).trim())}` : enc(t);
  return `${url.split("#")[0]}#:~:text=${frag}`;
}

const PRIORITY_COLOR: Record<string, string> = { High: "#dc2626", Normal: "#2563eb", Low: "#64748b" };

export function buildEmail(fb: Feedback, defaultSite: string) {
  let host = "";
  try { host = new URL(fb.url).hostname; } catch { /* ignore */ }
  const site = fb.siteName || defaultSite || host || "Website";
  const subject = `[OpinOnion] ${site} · ${fb.type}: ${clip(fb.comment.replace(/\s+/g, " "), 70)}`;
  const link = safeHttpUrl(fb.url);
  const pc = PRIORITY_COLOR[fb.priority] || "#2563eb";
  const hasOriginal = !!(fb.originalText || fb.originalSrc);
  const openUrl = textFragmentUrl(fb.url, fb.originalText) || link;
  const selected = fb.mode === "text" ? fb.originalText : "";
  const where = [
    fb.heading ? `Section: <b>${esc(fb.heading)}</b>` : "",
    `About ${fb.scrollPct}% down the page`,
    fb.tag ? `Element: &lt;${esc(fb.tag)}&gt;` : "",
  ].filter(Boolean).join(" &nbsp;·&nbsp; ");
  const context = selected && (fb.before || fb.after)
    ? `<div style="margin-top:10px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;font-size:14px;line-height:1.6;color:#334155">…${esc(fb.before)}<mark style="background:#fde68a;color:#0f172a;padding:1px 2px;border-radius:3px">${esc(selected)}</mark>${esc(fb.after)}…</div>`
    : "";
  const whereCard = `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;margin-bottom:20px">
<div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#64748b;margin-bottom:6px">Where on the page</div>
<div style="font-size:14px;color:#0f172a">${where}</div>${context}
${openUrl ? `<a href="${esc(openUrl)}" style="display:inline-block;margin-top:12px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600">Open page${selected ? " &amp; highlight the text" : ""} →</a>` : ""}
</div>`;
  const shotBlock = fb.screenshot
    ? `<div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#64748b;margin:0 0 6px">Screenshot</div><img src="cid:screenshot" alt="Screenshot" style="max-width:100%;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:20px">`
    : "";

  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#64748b;font-size:13px;vertical-align:top;white-space:nowrap">${k}</td><td style="padding:6px 0;font-size:14px;color:#0f172a;vertical-align:top">${v}</td></tr>`;
  const box = (label: string, bg: string, border: string, inner: string) =>
    `<td width="50%" valign="top" style="padding:0 6px"><div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#64748b;margin-bottom:6px">${label}</div><div style="background:${bg};border:1px solid ${border};border-radius:10px;padding:12px 14px;font-size:14px;line-height:1.5;color:#0f172a;white-space:pre-wrap;word-break:break-word">${inner}</div></td>`;

  const origInner = [
    fb.originalText ? esc(fb.originalText) : "",
    fb.originalSrc ? `<span style="color:#64748b">src:</span> <code style="font-size:12px">${esc(fb.originalSrc)}</code>` : "",
  ].filter(Boolean).join("<br><br>");

  const html = `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
<tr><td style="background:#0f172a;padding:18px 24px;color:#fff"><span style="font-size:18px;font-weight:700">🧅 OpinOnion</span><span style="float:right;font-size:13px;color:#cbd5e1">${esc(site)}</span></td></tr>
<tr><td style="padding:24px">
<div style="margin-bottom:14px"><span style="display:inline-block;background:#eef2ff;color:#4338ca;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:600">${esc(fb.type)}</span>
<span style="display:inline-block;background:${pc};color:#fff;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:600;margin-left:6px">${esc(fb.priority)} priority</span>
<span style="display:inline-block;background:#f1f5f9;color:#475569;border-radius:999px;padding:3px 10px;font-size:12px;margin-left:6px">${fb.mode === "text" ? "Text selection" : "Element"}</span></div>
<div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#64748b;margin-bottom:6px">Comment${fb.author ? ` · from ${esc(fb.author)}` : ""}</div>
<div style="font-size:16px;line-height:1.55;color:#0f172a;white-space:pre-wrap;word-break:break-word;margin-bottom:20px">${esc(fb.comment)}</div>
${whereCard}
${hasOriginal ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 -6px 20px"><tr>${box("Original content", "#fef2f2", "#fecaca", origInner)}${box("Requested change", "#f0fdf4", "#bbf7d0", esc(fb.comment))}</tr></table>` : ""}
${shotBlock}
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #e2e8f0;padding-top:8px">
${row("Site", esc(site))}
${row("Page", link ? `<a href="${esc(link)}" style="color:#4f46e5">${esc(clip(fb.url, 120))}</a>` : esc(fb.url))}
${fb.title ? row("Page title", esc(fb.title)) : ""}
${row("Viewport", `${fb.viewport.width}×${fb.viewport.height} (${esc(fb.viewport.device || "n/a")})`)}
${row("CSS selector", `<code style="font-size:12px;background:#f1f5f9;padding:2px 6px;border-radius:4px;word-break:break-all">${esc(fb.selector)}</code>`)}
${fb.xpath ? row("XPath", `<code style="font-size:12px;background:#f1f5f9;padding:2px 6px;border-radius:4px;word-break:break-all">${esc(fb.xpath)}</code>`) : ""}
${fb.userAgent ? row("Browser", `<span style="font-size:12px;color:#475569">${esc(clip(fb.userAgent, 160))}</span>`) : ""}
</table>
</td></tr></table></td></tr></table></body></html>`;

  const text = [
    `OpinOnion feedback — ${site}`,
    `Type: ${fb.type} | Priority: ${fb.priority}${fb.author ? ` | From: ${fb.author}` : ""}`,
    `Page: ${fb.url}`,
    `Viewport: ${fb.viewport.width}x${fb.viewport.height} (${fb.viewport.device})`,
    `Selector: ${fb.selector}`,
    fb.xpath ? `XPath: ${fb.xpath}` : "",
    "",
    fb.heading ? `Section: ${fb.heading}` : "",
    `Position: about ${fb.scrollPct}% down the page`,
    openUrl ? `Open at the text: ${openUrl}` : "",
    "",
    "COMMENT / REQUESTED CHANGE:", fb.comment,
    hasOriginal ? "\nORIGINAL CONTENT:" : "",
    fb.originalText, fb.originalSrc ? `src: ${fb.originalSrc}` : "",
  ].filter((l) => l !== "").join("\n");

  const attachments = fb.screenshot
    ? [{
        filename: `screenshot.${fb.screenshot.mime === "image/png" ? "png" : "jpg"}`,
        content: fb.screenshot.base64,
        content_id: "screenshot",
      }]
    : [];

  return { subject, html, text, attachments };
}
