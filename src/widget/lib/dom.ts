import type { Box, Target } from "./types";

const tagOf = (el: Element) => el.localName;

/** Shortest unique, path-based CSS selector (stops early at a unique #id or unique tail). */
export function cssSelector(el: Element): string {
  const parts: string[] = [];
  let cur: Element | null = el;
  while (cur && cur.nodeType === 1) {
    const tag = tagOf(cur);
    if (cur.id && document.querySelectorAll(`#${CSS.escape(cur.id)}`).length === 1) {
      parts.unshift(`#${CSS.escape(cur.id)}`);
      break;
    }
    let seg = tag;
    const parent: Element | null = cur.parentElement;
    if (parent && tag !== "html" && tag !== "body") {
      const same = Array.from(parent.children).filter((c) => c.localName === tag);
      if (same.length > 1) seg += `:nth-of-type(${same.indexOf(cur) + 1})`;
    }
    parts.unshift(seg);
    try {
      if (document.querySelectorAll(parts.join(" > ")).length === 1) break;
    } catch { /* invalid selector, keep walking */ }
    if (tag === "html") break;
    cur = parent;
  }
  return parts.join(" > ");
}

export function xPath(el: Element): string {
  const parts: string[] = [];
  let cur: Element | null = el;
  while (cur && cur.nodeType === 1) {
    const tag = tagOf(cur);
    const parent: Element | null = cur.parentElement;
    const same = parent ? Array.from(parent.children).filter((c) => c.localName === tag) : [cur];
    parts.unshift(same.length > 1 ? `${tag}[${same.indexOf(cur) + 1}]` : tag);
    cur = parent;
  }
  return "/" + parts.join("/");
}

const collapse = (s: string) => s.replace(/\s+/g, " ").trim();

/** Original text content and/or media URL of an element. */
export function describeOriginal(el: Element): { text: string; src: string } {
  let src = "";
  if (el instanceof HTMLImageElement) src = el.currentSrc || el.src;
  else if (el instanceof HTMLVideoElement) src = el.currentSrc || el.poster || "";
  else if (el instanceof HTMLSourceElement || el instanceof HTMLIFrameElement || el instanceof HTMLAudioElement) src = (el as any).src || "";
  else if (el instanceof SVGImageElement) src = el.href.baseVal;
  if (!src) {
    const bg = getComputedStyle(el).backgroundImage;
    const m = /url\((['"]?)(.*?)\1\)/.exec(bg);
    if (m) src = m[2];
  }
  let text = collapse((el as HTMLElement).innerText ?? el.textContent ?? "");
  if (el instanceof HTMLImageElement && !text) text = el.alt ? `alt: ${el.alt}` : "";
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) text = el.placeholder || text;
  return { text: text.slice(0, 1500), src };
}

export function deviceOf(width: number): "mobile" | "tablet" | "desktop" {
  return width < 768 ? "mobile" : width < 1024 ? "tablet" : "desktop";
}

export function rectsOf(t: Target): Box[] {
  const list = t.mode === "text" && t.range
    ? Array.from(t.range.getClientRects())
    : [t.el.getBoundingClientRect()];
  const boxes = list
    .filter((r) => r.width > 0 && r.height > 0)
    .map((r) => ({ left: r.left, top: r.top, width: r.width, height: r.height }));
  return boxes.length ? boxes : [{ left: 0, top: 0, width: 0, height: 0 }];
}

export function union(boxes: Box[]): Box {
  const l = Math.min(...boxes.map((b) => b.left));
  const t = Math.min(...boxes.map((b) => b.top));
  const r = Math.max(...boxes.map((b) => b.left + b.width));
  const b = Math.max(...boxes.map((x) => x.top + x.height));
  return { left: l, top: t, width: r - l, height: b - t };
}

export function labelOf(el: Element): string {
  const cls = typeof (el as HTMLElement).className === "string"
    ? (el as HTMLElement).className.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((c) => "." + c).join("")
    : "";
  return `${tagOf(el)}${el.id ? "#" + el.id : ""}${cls}`.slice(0, 48);
}

/** Where on the page the target is: nearest heading, surrounding text, vertical position. */
export function locateContext(t: Target): { heading: string; before: string; after: string; scrollPct: number } {
  const el = t.el;
  let heading = "";
  for (const h of Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6"))) {
    if (h === el || h.contains(el) || h.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) {
      heading = collapse(h.textContent ?? "").slice(0, 120);
    } else break;
  }

  let before = "", after = "";
  if (t.mode === "text" && t.selectedText) {
    let block: Element | null = el;
    while (block && block.parentElement && getComputedStyle(block).display.startsWith("inline")) block = block.parentElement;
    const text = collapse((block as HTMLElement | null)?.innerText ?? "");
    const sel = collapse(t.selectedText);
    const i = text.indexOf(sel);
    if (i >= 0) {
      before = text.slice(Math.max(0, i - 120), i);
      after = text.slice(i + sel.length, i + sel.length + 120);
    }
  }

  const top = el.getBoundingClientRect().top + window.scrollY;
  const total = Math.max(1, document.documentElement.scrollHeight);
  return { heading, before, after, scrollPct: Math.max(0, Math.min(100, Math.round((top / total) * 100))) };
}
