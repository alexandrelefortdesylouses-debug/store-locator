import { createPortal } from "react-dom";

// Portaled to document.body for the same reason as IcsExportModal: rendered
// from inside the backdrop-blur RoutePlanner panel, "fixed" would otherwise
// anchor to that panel's small box instead of the real viewport.
// `actionLabel`/`onAction` are optional — omitting them keeps this the same
// plain confirmation toast used everywhere else (export success, etc.);
// passing them turns it into an actionable "Annuler" toast for undoing a
// destructive action within the toast's lifetime.
export default function Toast({ message, actionLabel, onAction }) {
  if (!message) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[1300] flex justify-center px-4">
      <div
        className={`pointer-events-auto flex items-center gap-3 rounded-full bg-neutral-900 py-3 pl-5 text-sm font-medium text-white shadow-2xl dark:bg-amber-600 dark:text-neutral-950 ${
          onAction ? "pr-2" : "pr-5"
        }`}
      >

        <span className="flex items-center gap-2">
          <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.5l3 3 7-7" />
          </svg>
          {message}
        </span>
        {onAction && (
          <button
            type="button"
            onClick={onAction}
            className="shrink-0 cursor-pointer rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition hover:bg-white/25 dark:bg-black/10 dark:hover:bg-black/20"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
