export default function Header({ onOpenSettings }) {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-neutral-800 bg-neutral-950 px-5 py-3.5 md:px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-200/40 font-serif text-lg text-amber-200">
          T
        </div>
        <div className="leading-tight">
          <p className="font-serif text-xl uppercase tracking-[0.25em] text-white">
            Thélios
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-amber-200/70">
            LVMH Eyewear — Store Locator
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenSettings}
        className="cursor-pointer rounded-full border border-neutral-700 px-4 py-1.5 text-xs uppercase tracking-wide text-neutral-300 transition hover:border-amber-200/60 hover:text-amber-200"
      >
        Paramètres
      </button>
    </header>
  );
}
