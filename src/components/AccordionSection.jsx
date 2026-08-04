export default function AccordionSection({ title, count = 0, open, onToggle, children }) {
  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between gap-2 py-3.5 text-left transition hover:text-amber-700 dark:hover:text-amber-400"
      >
        <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-neutral-900 dark:text-neutral-100">
          {title}
        </span>
        <span className="flex items-center gap-2.5">
          {count > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-neutral-900 px-1.5 text-[10px] font-semibold text-white dark:bg-amber-600 dark:text-neutral-950">
              {count}
            </span>
          )}
          <svg
            className={`h-3.5 w-3.5 shrink-0 text-neutral-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pb-4" inert={!open}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
