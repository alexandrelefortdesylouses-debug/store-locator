import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";

const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");
const MAX_SUGGESTIONS = 7;

function normalize(text) {
  return text.normalize("NFD").replace(DIACRITICS_REGEX, "").toLowerCase();
}

export default function SearchBar({ value, onChange, stores = [], onSelectStore }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const rootRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const suggestions = useMemo(() => {
    const query = normalize(value.trim());
    if (query.length < 2) return [];

    const scored = [];
    for (const store of stores) {
      const name = normalize(store.name);
      const city = normalize(store.city);
      let score = -1;
      if (name.startsWith(query)) score = 0;
      else if (name.includes(query)) score = 1;
      else if (city.startsWith(query)) score = 2;
      else if (city.includes(query)) score = 3;
      if (score >= 0) scored.push({ store, score });
    }
    scored.sort((a, b) => a.score - b.score || a.store.name.localeCompare(b.store.name));
    return scored.slice(0, MAX_SUGGESTIONS).map((s) => s.store);
  }, [value, stores]);

  useEffect(() => {
    setHighlighted(-1);
  }, [suggestions.length, value]);

  function selectSuggestion(store) {
    onChange(store.name);
    setOpen(false);
    onSelectStore?.(store.id);
  }

  function handleKeyDown(e) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && highlighted >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={t("sidebar.searchPlaceholder")}
        role="combobox"
        aria-expanded={open && suggestions.length > 0}
        aria-autocomplete="list"
        className="w-full rounded-full border border-neutral-300 bg-white py-2.5 pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500"
      />

      {open && suggestions.length > 0 && (
        <ul className="thin-scrollbar absolute left-0 right-0 top-full z-30 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
          {suggestions.map((store, i) => (
            <li key={store.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectSuggestion(store)}
                onMouseEnter={() => setHighlighted(i)}
                className={`flex w-full cursor-pointer flex-col items-start rounded-lg px-2.5 py-1.5 text-left transition ${
                  highlighted === i
                    ? "bg-amber-50 dark:bg-neutral-800"
                    : "hover:bg-amber-50 dark:hover:bg-neutral-800"
                }`}
              >
                <span className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {store.name}
                </span>
                <span className="truncate text-xs text-neutral-400 dark:text-neutral-500">
                  {store.city}, {store.country}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
