import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { Box, Target } from "../lib/types";
import { cssSelector } from "../lib/dom";
import { IconClose } from "./Icons";

export const TYPES = ["Text Edit", "Design Fix", "Bug", "Other"] as const;
export const PRIORITIES = ["Low", "Normal", "High"] as const;

export interface FormValues { comment: string; type: string; priority: string; author: string }
interface Props {
  target: Target; anchor: Box; original: { text: string; src: string };
  busy: boolean; error: string; initialAuthor: string;
  onSubmit(v: FormValues): void; onCancel(): void;
}

const W = 348;
const chip = (on: boolean) =>
  `rounded-lg px-2.5 py-1 text-xs font-medium transition border ${on ? "border-onion-500 bg-onion-500/15 text-onion-600 dark:text-onion-400" : "border-slate-300/70 text-slate-600 hover:bg-slate-500/10 dark:border-white/15 dark:text-slate-300"}`;

export function Popover({ target, anchor, original, busy, error, initialAuthor, onSubmit, onCancel }: Props) {
  const [comment, setComment] = useState("");
  const [type, setType] = useState<string>(TYPES[0]);
  const [priority, setPriority] = useState<string>("Normal");
  const [author, setAuthor] = useState(initialAuthor);
  const ta = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { ta.current?.focus(); }, [target]);

  const selector = useMemo(() => cssSelector(target.el), [target]);

  // Placement: below the anchor, else above, else beside it (never on top of the target), else pinned above the toolbar.
  const vw = window.innerWidth, vh = window.innerHeight, H = 500;
  const w = Math.min(W, vw - 24);
  let left = Math.max(12, Math.min(anchor.left, vw - w - 12));
  const style: Record<string, string> = { width: `${w}px`, pointerEvents: "auto" };
  const below = anchor.top + anchor.height + 12;
  const sideTop = `${Math.max(12, Math.min(anchor.top, vh - H - 84))}px`;
  if (below + H < vh) style.top = `${Math.max(12, below)}px`;
  else if (anchor.top - 12 - H > 0) style.bottom = `${vh - anchor.top + 12}px`;
  else if (anchor.left + anchor.width + 12 + w <= vw - 12) { left = anchor.left + anchor.width + 12; style.top = sideTop; }
  else if (anchor.left - 12 - w >= 12) { left = anchor.left - 12 - w; style.top = sideTop; }
  else style.bottom = "84px";
  style.left = `${left}px`;

  const submit = () => { if (comment.trim() && !busy) onSubmit({ comment: comment.trim(), type, priority, author: author.trim() }); };
  const preview = target.mode === "text" ? target.selectedText || "" : original.text;

  return (
    <div class="oo-glass animate-pop fixed max-h-[calc(100vh-24px)] overflow-auto rounded-2xl p-4" style={style} role="dialog" aria-label="Add feedback">
      <div class="mb-3 flex items-center justify-between">
        <div class="text-sm font-semibold">{target.mode === "text" ? "Comment on selected text" : "Comment on element"}</div>
        <button onClick={onCancel} class="rounded-lg p-1 text-slate-500 hover:bg-slate-500/15" aria-label="Cancel"><IconClose /></button>
      </div>

      {(preview || original.src) && (
        <div class="mb-3 rounded-xl border border-slate-300/60 bg-slate-500/10 p-2.5 text-xs dark:border-white/10">
          <div class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Original</div>
          {preview && <div class="line-clamp-3 break-words text-slate-700 dark:text-slate-200">{preview.length > 220 ? preview.slice(0, 220) + "…" : preview}</div>}
          {original.src && <div class="mt-1 truncate font-mono text-[11px] text-slate-500" title={original.src}>{original.src}</div>}
        </div>
      )}

      <label class="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Requested change</label>
      <textarea
        ref={ta} rows={4} value={comment} placeholder={target.mode === "text" ? "Rewrite it as… / Fix the typo…" : "What should be changed here?"}
        onInput={(e) => setComment((e.target as HTMLTextAreaElement).value)}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(); } }}
        class="w-full resize-y rounded-xl border border-slate-300/70 bg-white/70 px-3 py-2 text-sm outline-none focus:border-onion-500 focus:ring-2 focus:ring-onion-500/30 dark:border-white/15 dark:bg-slate-800/70 dark:text-white"
      />

      <div class="mt-3 flex flex-wrap gap-1.5">{TYPES.map((t) => <button type="button" class={chip(type === t)} onClick={() => setType(t)}>{t}</button>)}</div>
      <div class="mt-2 flex flex-wrap items-center gap-1.5">
        <span class="mr-1 text-xs text-slate-500">Priority</span>
        {PRIORITIES.map((p) => <button type="button" class={chip(priority === p)} onClick={() => setPriority(p)}>{p}</button>)}
      </div>

      <input
        value={author} placeholder="Your name (optional)" onInput={(e) => setAuthor((e.target as HTMLInputElement).value)}
        class="mt-3 w-full rounded-xl border border-slate-300/70 bg-white/70 px-3 py-2 text-xs outline-none focus:border-onion-500 dark:border-white/15 dark:bg-slate-800/70 dark:text-white"
      />
      <div class="mt-2 truncate font-mono text-[10px] text-slate-500" title={selector}>{selector}</div>

      {error && <div class="mt-2 text-xs text-red-500" role="alert">{error}</div>}
      <div class="mt-3 flex items-center justify-end gap-2">
        <span class="mr-auto text-[10px] text-slate-500">⌘/Ctrl + Enter</span>
        <button onClick={onCancel} class="rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-500/15 dark:text-slate-300">Cancel</button>
        <button onClick={submit} disabled={busy || !comment.trim()} class="rounded-xl bg-gradient-to-br from-onion-500 to-onion-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:brightness-110 disabled:opacity-50">
          {busy ? "Sending…" : "Send Feedback"}
        </button>
      </div>
    </div>
  );
}
