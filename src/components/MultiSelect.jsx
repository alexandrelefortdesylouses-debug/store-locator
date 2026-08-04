import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";

const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");

function normalize(text) {
  return text.normalize("NFD").replace(DIACRITICS_REGEX, "").toLowerCase();
}

function toOption(entry) {
  return typeof entry === "string" ? { value: entry, label: entry } : entry;
}

export default function MultiSelect({
  label,
  placeholder,
  groups,
  options,
  selected,
  onChange,
  searchable = false,
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const rawGroups = useMemo(
    () =>
      groups
        ? groups.map((g) => ({ label: g.label, options: g.options.map(toOption) }))
        : [{ label: null, options: (options || []).map(toOption) }],
    [groups, options],
  );

  const labelOf = useMemo(() => {
    const map = new Map();
    rawGroups.forEach((g) => g.options.forEach((o) => map.set(o.value, o.label)));
    return (value) => map.get(value) ?? value;
  }, [rawGroups]);

  const visibleGroups = useMemo(() => {
    const q = normalize(query.trim());
    return rawGroups
      .map((g) => ({
        label: g.label,
        options: q ? g.options.filter((o) => normalize(o.label).includes(q)) : g.options,
      }))
      .filter((g) => g.options.length > 0);
  }, [rawGroups, query]);

  function toggle(value) {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  }

  function remove(value) {
    onChange(selected.filter((v) => v !== value));
  }

  return (
    <div ref={rootRef} className="relative">
      {label && (
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
          {label}
        </p>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-full border border-neutral-300 bg-white py-2.5 pl-4 pr-3 text-left text-sm text-neutral-900 transition hover:border-amber-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
      >
        <span className={selected.length === 0 ? "text-neutral-400 dark:text-neutral-500" : ""}>
          {selected.length === 0
            ? placeholder
            : t("sidebar.selectedCount", { count: selected.length })}
        </span>
        <svg
          className={`h-3.5 w-3.5 shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {selected.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {selected.map((value) => (
            <span
              key={value}
              className="flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 py-1 pl-2.5 pr-1.5 text-[11px] text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
            >
              {labelOf(value)}
              <button
                type="button"
                onClick={() => remove(value)}
                className="flex h-3.5 w-3.5 cursor-pointer items-center justify-center text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-100"
                aria-label={`${t("sidebar.removeSelection")} ${labelOf(value)}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="thin-scrollbar absolute left-0 right-0 top-full z-30 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-2 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
          {searchable && (
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("sidebar.searchInList")}
              className="mb-2 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-900 focus:border-amber-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
          )}

          {visibleGroups.length === 0 && (
            <p className="px-2 py-3 text-center text-xs text-neutral-400 dark:text-neutral-500">
              {t("sidebar.noMatch")}
            </p>
          )}

          {visibleGroups.map((group, gi) => (
            <div key={group.label || gi} className={gi > 0 ? "mt-2" : ""}>
              {group.label && (
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                  {group.label}
                </p>
              )}
              {group.options.map((option) => {
                const active = selected.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggle(option.value)}
                    aria-pressed={active}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-neutral-700 transition hover:bg-amber-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition ${
                        active
                          ? "border-amber-600 bg-amber-600 text-white dark:border-amber-500 dark:bg-amber-500"
                          : "border-neutral-300 dark:border-neutral-600"
                      }`}
                    >
                      {active && (
                        <svg
                          viewBox="0 0 16 16"
                          className="h-2.5 w-2.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.5l3 3 7-7" />
                        </svg>
                      )}
                    </span>
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })}
            </div>
          ))}

          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-2 w-full cursor-pointer rounded-lg px-2 py-1.5 text-center text-xs text-neutral-500 transition hover:text-amber-700 dark:text-neutral-400 dark:hover:text-amber-400"
            >
              {t("sidebar.clearSelection")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
