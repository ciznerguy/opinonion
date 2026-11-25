import { useCallback, useEffect, useState } from "preact/hooks";
import { ApiError, getConfig, loadToken, saveToken, sendFeedback, setActiveFlag } from "../lib/api";
import { describeOriginal, deviceOf, labelOf, rectsOf, union, cssSelector, xPath } from "../lib/dom";
import type { Box, FeedbackPayload, Mode, Target } from "../lib/types";
import { AuthModal } from "./AuthModal";
import { Overlay } from "./Overlay";
import { Popover, type FormValues } from "./Popover";
import { Toolbar } from "./Toolbar";

const cfg = getConfig();
const store = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
};

export function App({ host }: { host: HTMLElement }) {
  const [open, setOpen] = useState(true);
  const [token, setToken] = useState<string | null>(loadToken);
  const [mode, setMode] = useState<Mode>(null);
  const [hover, setHover] = useState<Element | null>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const [, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const [dark, setDark] = useState(() => {
    const saved = store.get("opinonion:theme");
    return saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const reset = useCallback(() => { setMode(null); setHover(null); setTarget(null); setError(""); }, []);
  const authed = !!token && open;

  // Toggle via loader shortcut.
  useEffect(() => {
    const t = () => setOpen((o) => { if (o) reset(); return !o; });
    window.addEventListener("opinonion:toggle", t);
    return () => window.removeEventListener("opinonion:toggle", t);
  }, [reset]);

  // Tell the loader to re-open the widget on the next page of this tab's session.
  useEffect(() => { setActiveFlag(authed); }, [authed]);

  // Prefetch the screenshot chunk only after authentication.
  useEffect(() => { if (token) void import("../lib/capture"); }, [token]);

  // Keep overlays aligned on scroll/resize.
  useEffect(() => {
    if (!hover && !target) return;
    let raf = 0;
    const bump = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setTick((n) => n + 1)); };
    window.addEventListener("scroll", bump, true);
    window.addEventListener("resize", bump);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", bump, true); window.removeEventListener("resize", bump); };
  }, [hover, target]);

  // Esc: close popover first, then leave the mode.
  useEffect(() => {
    if (!authed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (target) setTarget(null); else if (mode) { setMode(null); setHover(null); }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [authed, target, mode]);

  // ---- Select Element mode ---------------------------------------------------
  useEffect(() => {
    if (!authed || mode !== "select") return;
    const inHost = (e: Event) => e.composedPath().includes(host);
    const real = (e: Event): Element | null => {
      const t = e.composedPath()[0] as Node | undefined;
      return t instanceof Element ? t : t?.parentElement ?? null;
    };
    const onMove = (e: MouseEvent) => {
      if (inHost(e)) return setHover(null);
      const el = real(e);
      setHover(el && el !== document.documentElement ? el : null);
    };
    const block = (e: Event) => {
      if (inHost(e)) return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    };
    const onClick = (e: MouseEvent) => {
      if (inHost(e)) return;
      block(e);
      const el = real(e);
      if (el && el !== document.documentElement) { setTarget({ mode: "element", el }); setError(""); setHover(null); }
    };
    const blocked = ["mousedown", "mouseup", "pointerdown", "pointerup", "dblclick", "auxclick"];
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("click", onClick, true);
    blocked.forEach((t) => document.addEventListener(t, block, true));
    return () => {
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("click", onClick, true);
      blocked.forEach((t) => document.removeEventListener(t, block, true));
      setHover(null);
    };
  }, [authed, mode, host]);

  // ---- Text Highlight mode ----------------------------------------------------
  useEffect(() => {
    if (!authed || mode !== "text") return;
    const onUp = (e: Event) => {
      if (e.composedPath().includes(host)) return;
      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.rangeCount) return;
        const text = sel.toString().trim();
        if (!text) return;
        const range = sel.getRangeAt(0).cloneRange();
        const n = range.commonAncestorContainer;
        const el = n instanceof Element ? n : n.parentElement;
        if (!el || host.contains(el)) return;
        setTarget({ mode: "text", el, range, selectedText: text.slice(0, 2000) });
        setError("");
        sel.removeAllRanges(); // we draw our own highlight from the stored range
      }, 10);
    };
    document.addEventListener("mouseup", onUp, true);
    document.addEventListener("touchend", onUp, true);
    return () => { document.removeEventListener("mouseup", onUp, true); document.removeEventListener("touchend", onUp, true); };
  }, [authed, mode, host]);

  // ---- Submit -------------------------------------------------------------------
  const submit = useCallback(async (v: FormValues) => {
    if (!target || !token) return;
    setBusy(true); setError("");
    const boxes = rectsOf(target);
    const orig = describeOriginal(target.el);
    let screenshot: string | null = null;
    try {
      const { captureScreenshot } = await import("../lib/capture");
      screenshot = await captureScreenshot(host, union(boxes), boxes);
    } catch (e) { console.warn("[OpinOnion] screenshot failed", e); }

    const payload: FeedbackPayload = {
      siteName: cfg.site || location.hostname, siteKey: cfg.siteKey,
      comment: v.comment, type: v.type, priority: v.priority, author: v.author,
      mode: target.mode,
      url: location.href, title: document.title,
      viewport: { width: innerWidth, height: innerHeight, device: deviceOf(innerWidth) },
      selector: cssSelector(target.el), xpath: xPath(target.el), tag: target.el.localName,
      originalText: target.mode === "text" ? target.selectedText || "" : orig.text,
      originalSrc: orig.src,
      userAgent: navigator.userAgent,
      screenshot,
    };
    try {
      await sendFeedback(cfg, token, payload);
      if (v.author) store.set("opinonion:author", v.author);
      setTarget(null);
      setToast({ ok: true, msg: screenshot ? "Feedback sent ✓" : "Feedback sent (without screenshot)" });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        saveToken(null); setToken(null); reset();
      } else setError((e as Error).message);
    } finally { setBusy(false); }
  }, [target, token, host, reset]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const logout = () => { saveToken(null); setToken(null); reset(); };
  const toggleTheme = () => { setDark((d) => { store.set("opinonion:theme", d ? "light" : "dark"); return !d; }); };

  // Recomputed each render (cheap; re-rendered on scroll/resize via tick).
  const targetBoxes: Box[] = target ? rectsOf(target) : [];
  const hoverView = hover && !target ? { boxes: rectsOf({ mode: "element", el: hover }), label: labelOf(hover) } : null;

  return (
    <div class={`oo-root ${dark ? "oo-dark" : ""}`} onKeyDown={(e) => e.stopPropagation()} onKeyUp={(e) => e.stopPropagation()} onKeyPress={(e) => e.stopPropagation()}>
      {open && !token && <AuthModal cfg={cfg} onClose={() => setOpen(false)} onSuccess={(t, exp) => { saveToken(t, exp); setToken(t); }} />}
      {authed && (
        <>
          <Overlay hover={hoverView} target={targetBoxes} />
          {target && (
            <Popover
              key={target.el.localName + targetBoxes.length + (target.selectedText || "")}
              target={target} anchor={union(targetBoxes)} original={describeOriginal(target.el)}
              busy={busy} error={error} initialAuthor={store.get("opinonion:author") || ""}
              onSubmit={submit} onCancel={() => { setTarget(null); setError(""); }}
            />
          )}
          <Toolbar mode={mode} dark={dark} onMode={(m) => { setMode(m); setTarget(null); setHover(null); }} onTheme={toggleTheme} onClose={() => { setOpen(false); reset(); }} onLogout={logout} />
          {toast && (
            <div class={`oo-glass animate-pop fixed bottom-[84px] left-1/2 -translate-x-1/2 rounded-xl px-4 py-2 text-sm font-medium ${toast.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`} role="status">{toast.msg}</div>
          )}
        </>
      )}
    </div>
  );
}
