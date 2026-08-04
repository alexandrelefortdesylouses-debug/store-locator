import { createPortal } from "react-dom";

// Portaled to document.body for the same reason as IcsExportModal: rendered
// from inside the backdrop-blur RoutePlanner panel, "fixed" would otherwise
// anchor to that panel's small box instead of the real viewport.
export default function Toast({ message }) {
  if (!message) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[1300] flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-3 text-sm font-medium text-white shadow-2xl dark:bg-amber-600 dark:text-neutral-950">
        <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.5l3 3 7-7" />
        </svg>
        {message}
      </div>
    </div>,
    document.body,
  );
}
