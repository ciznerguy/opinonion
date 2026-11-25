// Lazy chunk: only downloaded after authentication (see App.tsx prefetch).
import { domToCanvas } from "modern-screenshot";
import type { Box } from "./types";

const MAX_W = 1400; // output width cap (px)

/**
 * Screenshot of the current viewport, cropped around `focus` (viewport coords)
 * with the target outlined. The widget host is excluded from the capture.
 * Known limitation: position:fixed elements may be offset when the page is scrolled.
 */
export async function captureScreenshot(host: Element, focus: Box, outlines: Box[]): Promise<string | null> {
  const vw = window.innerWidth, vh = window.innerHeight;
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  const work = domToCanvas(document.documentElement, {
    width: vw,
    height: vh,
    scale,
    backgroundColor: getComputedStyle(document.body).backgroundColor === "rgba(0, 0, 0, 0)" ? "#ffffff" : undefined,
    style: { transform: `translate(${-window.scrollX}px, ${-window.scrollY}px)`, transformOrigin: "top left" },
    filter: (n) => n !== host,
    timeout: 8000,
  });
  const full = await Promise.race([work, new Promise<null>((r) => setTimeout(() => r(null), 12000))]);
  if (!full) return null;

  // Crop: small targets get context padding; huge targets simply use the whole viewport.
  const pad = 56;
  const cx = Math.max(0, focus.left - pad), cy = Math.max(0, focus.top - pad);
  const cw = Math.min(vw - cx, focus.width + pad * 2), ch = Math.min(vh - cy, focus.height + pad * 2);
  const useFull = cw * ch > vw * vh * 0.6 || cw < 120 || ch < 80;
  const sx = useFull ? 0 : cx, sy = useFull ? 0 : cy, sw = useFull ? vw : cw, sh = useFull ? vh : ch;

  const k = Math.min(1, MAX_W / (sw * scale));
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(sw * scale * k));
  out.height = Math.max(1, Math.round(sh * scale * k));
  const ctx = out.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(full, sx * scale, sy * scale, sw * scale, sh * scale, 0, 0, out.width, out.height);

  const s = scale * k;
  ctx.lineWidth = Math.max(2, 2.5 * s);
  ctx.strokeStyle = "#a855f7";
  ctx.fillStyle = "rgba(168,85,247,0.14)";
  for (const b of outlines) {
    const x = (b.left - sx) * s, y = (b.top - sy) * s, w = b.width * s, h = b.height * s;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
  }

  for (const q of [0.82, 0.6, 0.4]) {
    const url = out.toDataURL("image/jpeg", q);
    if (url.length < 3.5 * 1024 * 1024) return url;
  }
  return null;
}
