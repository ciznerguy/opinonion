import type { Mode } from "../lib/types";
import { IconClose, IconLogout, IconMoon, IconSelect, IconSun, IconText } from "./Icons";

interface Props {
  mode: Mode; dark: boolean;
  onMode(m: Mode): void; onTheme(): void; onClose(): void; onLogout(): void;
}

const btn = (active: boolean) =>
  `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
    active ? "bg-gradient-to-br from-onion-500 to-onion-600 text-white shadow-md" : "text-slate-700 hover:bg-slate-500/15 dark:text-slate-200"
  }`;
const icon = "rounded-xl p-2 text-slate-600 transition hover:bg-slate-500/15 dark:text-slate-300";

export function Toolbar({ mode, dark, onMode, onTheme, onClose, onLogout }: Props) {
  return (
    <div class="oo-glass animate-pop fixed bottom-5 left-1/2 flex max-w-[96vw] -translate-x-1/2 items-center gap-1 rounded-2xl p-1.5" style={{ pointerEvents: "auto" }} role="toolbar" aria-label="OpinOnion toolbar">
      <span class="select-none px-2 text-base" title="OpinOnion">🧅</span>
      <button class={btn(mode === "select")} onClick={() => onMode(mode === "select" ? null : "select")} title="Select an element (click to comment)" aria-pressed={mode === "select"}>
        <IconSelect /><span class="hidden sm:inline">Select element</span>
      </button>
      <button class={btn(mode === "text")} onClick={() => onMode(mode === "text" ? null : "text")} title="Highlight text to comment" aria-pressed={mode === "text"}>
        <IconText /><span class="hidden sm:inline">Highlight text</span>
      </button>
      <span class="mx-1 h-6 w-px bg-slate-500/25" />
      <button class={icon} onClick={onTheme} title={dark ? "Light mode" : "Dark mode"} aria-label="Toggle theme">{dark ? <IconSun /> : <IconMoon />}</button>
      <button class={icon} onClick={onLogout} title="Sign out" aria-label="Sign out"><IconLogout /></button>
      <button class={icon} onClick={onClose} title="Hide (Ctrl/Cmd+Shift+O)" aria-label="Hide toolbar"><IconClose /></button>
    </div>
  );
}
