import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { getGlobalNoteHtml, setGlobalNoteHtml } from "../utils/globalNote";

const SAVE_DEBOUNCE_MS = 600;
const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");
function normalize(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .toLowerCase();
}

const MENTION_CLASSNAME = {
  store:
    "mx-0.5 inline-block cursor-pointer rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900",
  brand:
    "mx-0.5 inline-block cursor-pointer rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900",
};

// Single-page global note for the whole "Mon Carnet" portfolio, with
// live-typed "@" mentions of opticians and brands. Auto-saves locally on a
// debounce (see utils/globalNote.js — per-device only, no real Cloud sync).
// The per-store dated visit-note log lives elsewhere now (see
// CarnetVisitNoteModal, opened from the table's "Note" action) and is
// untouched by this rewrite.
export default function CarnetNotesTab({ stores, allBrands, onOpenStore, onFilterBrand }) {
  const { t } = useLanguage();
  const editorRef = useRef(null);
  const wrapperRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const mentionRangeRef = useRef(null);
  const [saveState, setSaveState] = useState("saved");
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionPos, setMentionPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = getGlobalNoteHtml();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      window.clearTimeout(saveTimeoutRef.current);
      if (editorRef.current) setGlobalNoteHtml(editorRef.current.innerHTML);
    },
    [],
  );

  function scheduleSave() {
    setSaveState("saving");
    window.clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => {
      if (editorRef.current) setGlobalNoteHtml(editorRef.current.innerHTML);
      setSaveState("saved");
    }, SAVE_DEBOUNCE_MS);
  }

  function detectMentionTrigger() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) {
      setMentionQuery(null);
      return;
    }
    const node = sel.anchorNode;
    if (!node || node.nodeType !== Node.TEXT_NODE || !editorRef.current?.contains(node)) {
      setMentionQuery(null);
      return;
    }
    const offset = sel.anchorOffset;
    const textBefore = node.textContent.slice(0, offset);
    const match = textBefore.match(/(?:^|\s)@([^\s@]*)$/);
    if (!match) {
      setMentionQuery(null);
      return;
    }
    const query = match[1];
    const atOffset = offset - query.length - 1;

    const range = document.createRange();
    range.setStart(node, atOffset);
    range.setEnd(node, offset);
    mentionRangeRef.current = range;

    const rect = range.getBoundingClientRect();
    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0 && rect.top === 0) {
      setMentionQuery(null);
      return;
    }
    setMentionPos({ top: rect.bottom - wrapperRect.top + 4, left: Math.max(0, rect.left - wrapperRect.left) });
    setMentionQuery(query);
  }

  function handleInput() {
    detectMentionTrigger();
    scheduleSave();
  }

  function handleContainerClick(e) {
    const mentionEl = e.target.closest?.("[data-mention-type]");
    if (mentionEl) {
      const type = mentionEl.getAttribute("data-mention-type");
      const value = mentionEl.getAttribute("data-mention-value");
      if (type === "store") onOpenStore(value);
      else if (type === "brand") onFilterBrand(value);
    }
    detectMentionTrigger();
  }

  function handleKeyDown(e) {
    if (mentionQuery === null) return;
    if (e.key === "Escape") {
      e.preventDefault();
      setMentionQuery(null);
      mentionRangeRef.current = null;
      return;
    }
    if (e.key === "Enter" || e.key === "Tab") {
      const first = suggestions[0];
      if (first) {
        e.preventDefault();
        insertMention(first);
      }
    }
  }

  function insertMention(item) {
    const range = mentionRangeRef.current;
    if (!range || !editorRef.current) return;
    range.deleteContents();

    const span = document.createElement("span");
    span.setAttribute("contenteditable", "false");
    span.setAttribute("data-mention-type", item.type);
    span.setAttribute("data-mention-value", item.value);
    span.className = MENTION_CLASSNAME[item.type];
    span.textContent = `@${item.label}`;

    const spaceNode = document.createTextNode(" ");
    const frag = document.createDocumentFragment();
    frag.appendChild(span);
    frag.appendChild(spaceNode);
    range.insertNode(frag);

    const sel = window.getSelection();
    const newRange = document.createRange();
    newRange.setStartAfter(spaceNode);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);

    setMentionQuery(null);
    mentionRangeRef.current = null;
    scheduleSave();
    editorRef.current.focus();
  }

  const query = mentionQuery ?? "";
  const nq = normalize(query);
  const storeSuggestions =
    mentionQuery === null
      ? []
      : [...stores]
          .filter((s) => normalize(s.name).includes(nq))
          .slice(0, 5)
          .map((s) => ({ type: "store", value: s.id, label: s.name, sub: s.city }));
  const brandSuggestions =
    mentionQuery === null
      ? []
      : allBrands
          .filter((b) => normalize(b).includes(nq))
          .slice(0, 5)
          .map((b) => ({ type: "brand", value: b, label: b }));
  const suggestions = [...storeSuggestions, ...brandSuggestions];

  return (
    <div ref={wrapperRef} className="relative max-w-3xl">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="font-serif text-base text-neutral-900 dark:text-neutral-100">{t("carnet.tab.notes")}</h3>
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          {saveState === "saving" ? t("carnet.globalNote.saving") : t("carnet.globalNote.saved")}
        </p>
      </div>
      <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">{t("carnet.globalNote.localOnlyHint")}</p>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyUp={detectMentionTrigger}
        onClick={handleContainerClick}
        onKeyDown={handleKeyDown}
        data-placeholder={t("carnet.globalNote.placeholder")}
        className="notes-editor thin-scrollbar min-h-[420px] w-full rounded-xl border border-neutral-300 bg-white p-4 text-sm leading-relaxed text-neutral-900 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
      />

      {mentionQuery !== null && (
        <div
          className="thin-scrollbar absolute z-30 w-64 max-h-72 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
          style={{ top: mentionPos.top, left: mentionPos.left }}
        >
          {suggestions.length === 0 ? (
            <p className="px-2.5 py-2 text-xs text-neutral-400 dark:text-neutral-500">
              {t("carnet.globalNote.mentionNoResults")}
            </p>
          ) : (
            <>
              {storeSuggestions.length > 0 && (
                <p className="px-2.5 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                  {t("carnet.globalNote.sectionStores")}
                </p>
              )}
              {storeSuggestions.map((item) => (
                <button
                  key={`s-${item.value}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertMention(item);
                  }}
                  className="flex w-full cursor-pointer flex-col items-start rounded-lg px-2.5 py-1.5 text-left transition hover:bg-amber-50 dark:hover:bg-neutral-800"
                >
                  <span className="text-sm text-neutral-800 dark:text-neutral-100">{item.label}</span>
                  <span className="text-[11px] text-neutral-400 dark:text-neutral-500">{item.sub}</span>
                </button>
              ))}
              {brandSuggestions.length > 0 && (
                <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                  {t("carnet.globalNote.sectionBrands")}
                </p>
              )}
              {brandSuggestions.map((item) => (
                <button
                  key={`b-${item.value}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertMention(item);
                  }}
                  className="flex w-full cursor-pointer items-center rounded-lg px-2.5 py-1.5 text-left text-sm text-neutral-800 transition hover:bg-amber-50 dark:text-neutral-100 dark:hover:bg-neutral-800"
                >
                  {item.label}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
