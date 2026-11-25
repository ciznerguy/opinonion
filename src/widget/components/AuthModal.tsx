import { useEffect, useRef, useState } from "preact/hooks";
import { ApiError, authenticate } from "../lib/api";
import type { WidgetConfig } from "../lib/types";
import { IconClose, IconLock } from "./Icons";

interface Props { cfg: WidgetConfig; onSuccess(token: string, expiresAt: number): void; onClose(): void }

export function AuthModal({ cfg, onSuccess, onClose }: Props) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  async function submit(e: Event) {
    e.preventDefault();
    if (!pw || busy) return;
    setBusy(true); setErr("");
    try {
      const { token, expiresAt } = await authenticate(cfg, pw);
      onSuccess(token, expiresAt);
    } catch (e) {
      setErr(e instanceof ApiError && e.status === 401 ? "Wrong password. Try again." : e instanceof ApiError && e.status === 429 ? "Too many attempts. Wait a minute." : (e as Error).message);
      setBusy(false);
      ref.current?.select();
    }
  }

  return (
    <div class="fixed inset-0 grid place-items-center bg-slate-900/30 backdrop-blur-[2px]" style={{ pointerEvents: "auto" }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={submit} class="oo-glass animate-pop w-[min(92vw,360px)] rounded-2xl p-6" role="dialog" aria-modal="true" aria-label="OpinOnion sign in">
        <div class="mb-4 flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-onion-400 to-onion-600 text-white shadow-lg"><IconLock /></div>
            <div>
              <div class="text-base font-semibold">OpinOnion</div>
              <div class="text-xs text-slate-500 dark:text-slate-400">{cfg.site ? `Feedback for ${cfg.site}` : "Enter the workspace password"}</div>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" class="rounded-lg p-1 text-slate-500 hover:bg-slate-500/15"><IconClose /></button>
        </div>
        <input
          ref={ref} type="password" value={pw} autocomplete="current-password" placeholder="Password"
          onInput={(e) => setPw((e.target as HTMLInputElement).value)}
          class="w-full rounded-xl border border-slate-300/70 bg-white/70 px-3.5 py-2.5 text-sm outline-none transition focus:border-onion-500 focus:ring-2 focus:ring-onion-500/30 dark:border-white/15 dark:bg-slate-800/70 dark:text-white"
        />
        <div class="mt-2 min-h-[18px] text-xs text-red-500" role="alert">{err}</div>
        <button type="submit" disabled={busy || !pw} class="mt-2 w-full rounded-xl bg-gradient-to-br from-onion-500 to-onion-600 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110 disabled:opacity-50">
          {busy ? "Checking…" : "Unlock"}
        </button>
      </form>
    </div>
  );
}
