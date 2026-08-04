import { useState } from "react";
import { PRESET_TAGS } from "../utils/myCard";
import { useLanguage } from "../i18n/LanguageContext";

export default function TagPicker({ tags, onChange }) {
  const { t } = useLanguage();
  const [customTag, setCustomTag] = useState("");

  function toggleTag(tag) {
    onChange(tags.includes(tag) ? tags.filter((tg) => tg !== tag) : [...tags, tag]);
  }

  function addCustomTag(e) {
    e.preventDefault();
    const trimmed = customTag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    onChange([...tags, trimmed]);
    setCustomTag("");
  }

  const customTags = tags.filter((tag) => !PRESET_TAGS.includes(tag));

  return (
    <div className="mb-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {t("myCard.tagsTitle")}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {PRESET_TAGS.map((tag) => {
          const active = tags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              aria-pressed={active}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs transition ${
                active
                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-amber-600 dark:bg-amber-600 dark:text-neutral-950"
                  : "border-neutral-300 text-neutral-600 hover:border-amber-400 hover:text-amber-700 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-amber-500 dark:hover:text-amber-400"
              }`}
            >
              {tag}
            </button>
          );
        })}
        {customTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className="flex cursor-pointer items-center gap-1 rounded-full border border-neutral-900 bg-neutral-900 px-3 py-1.5 text-xs text-white dark:border-amber-600 dark:bg-amber-600 dark:text-neutral-950"
          >
            {tag}
            <span aria-hidden>✕</span>
          </button>
        ))}
      </div>
      <form onSubmit={addCustomTag} className="mt-2 flex gap-1.5">
        <input
          type="text"
          value={customTag}
          onChange={(e) => setCustomTag(e.target.value)}
          placeholder={t("myCard.addTagPlaceholder")}
          className="flex-1 rounded-full border border-neutral-300 bg-transparent px-3 py-1.5 text-xs text-neutral-900 focus:border-amber-400 focus:outline-none dark:border-neutral-600 dark:text-neutral-100"
        />
        <button
          type="submit"
          className="cursor-pointer rounded-full border border-neutral-300 px-3 py-1.5 text-xs text-neutral-600 transition hover:border-amber-400 hover:text-amber-700 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-amber-500 dark:hover:text-amber-400"
        >
          {t("myCard.addTagButton")}
        </button>
      </form>
    </div>
  );
}
