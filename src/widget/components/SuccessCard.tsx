/** Large, centered confirmation shown after feedback is sent successfully. */
export function SuccessCard({ note }: { note: string }) {
  return (
    <div class="fixed inset-0 grid place-items-center" style={{ pointerEvents: "none" }} role="status" aria-live="polite">
      <div class="oo-glass animate-pop flex max-w-[92vw] items-center gap-4 rounded-2xl px-6 py-5">
        <div class="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-500 text-white shadow-lg">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </div>
        <div>
          <div class="text-lg font-semibold">Feedback sent</div>
          <div class="text-sm text-slate-600 dark:text-slate-300">{note}</div>
        </div>
      </div>
    </div>
  );
}
