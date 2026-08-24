import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import StatusDot from "./StatusDot";
import { savePhoto, getPhoto, resizeImageFile } from "../utils/photoStore";

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path strokeLinecap="round" d="M5 11a7 7 0 0014 0M12 18v3" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 8a1 1 0 011-1h2l1.2-2h7.6L17 7h2a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V8z"
      />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}

// Web Speech API dictation for the note textarea — feature-detected (no
// support in Safari/Firefox at the time of writing), so the mic button
// simply doesn't render rather than showing a broken control. Local
// browser transcription only, nothing sent anywhere.
function useVoiceDictation(onTranscript, lang) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const SpeechRecognitionCtor =
    typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  function toggle() {
    if (!SpeechRecognitionCtor) return;
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = lang === "en" ? "en-US" : "fr-FR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript;
      if (transcript) onTranscript(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return { listening, toggle, supported: Boolean(SpeechRecognitionCtor) };
}

// Loads a stored photo blob from IndexedDB by id and renders it as a small
// clickable (opens full-size in a new tab) thumbnail — loaded lazily per
// entry rather than all at once, and the object URL is revoked on unmount
// to avoid leaking memory as the history list grows.
function PhotoThumbnail({ photoId }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;
    getPhoto(photoId).then((blob) => {
      if (cancelled || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photoId]);

  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="mt-1.5 block">
      <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover" />
    </a>
  );
}

// Per-store dated visit-note entry, opened from Mon Carnet table's "Note"
// action. Kept on the same data layer as before (utils/activity.js) — this
// modal only relocates the entry UI that used to live inline in the
// Bloc-Notes tab, now that tab is a single global freeform note instead.
export default function CarnetVisitNoteModal({ store, status, entries, onAddVisitNote, onClose }) {
  const { t, lang } = useLanguage();
  const [draft, setDraft] = useState("");
  const [pendingPhoto, setPendingPhoto] = useState(null); // { id, previewUrl }
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileInputRef = useRef(null);
  const locale = lang === "en" ? "en-US" : "fr-FR";

  const { listening, toggle: toggleDictation, supported: dictationSupported } = useVoiceDictation(
    (transcript) => setDraft((prev) => (prev.trim() ? `${prev.trim()} ${transcript}` : transcript)),
    lang,
  );

  useEffect(
    () => () => {
      if (pendingPhoto?.previewUrl) URL.revokeObjectURL(pendingPhoto.previewUrl);
    },
    [pendingPhoto],
  );

  async function handlePhotoSelected(file) {
    if (!file) return;
    setPhotoBusy(true);
    try {
      const resized = await resizeImageFile(file);
      const id = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await savePhoto(id, resized);
      setPendingPhoto({ id, previewUrl: URL.createObjectURL(resized) });
    } catch {
      // Resize/save failed (unsupported format, IndexedDB unavailable in a
      // private/locked-down browser…) — the note itself still works
      // without a photo, so this fails silently rather than blocking it.
    } finally {
      setPhotoBusy(false);
    }
  }

  function handleAdd() {
    if (!draft.trim()) return;
    onAddVisitNote(store.id, draft.trim(), pendingPhoto?.id || null);
    setDraft("");
    setPendingPhoto(null);
  }

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-200 p-5 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <StatusDot status={status} />
            <div>
              <h2 className="font-serif text-lg text-neutral-900 dark:text-neutral-100">{store.name}</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {store.address}, {store.city}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("storeDetail.close")}
            className="cursor-pointer rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            ✕
          </button>
        </div>

        <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
          <div className="mb-5">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              placeholder={t("carnet.notes.addPlaceholder")}
              className="w-full resize-none rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm text-neutral-900 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-neutral-600 dark:text-neutral-100"
            />

            {pendingPhoto && (
              <div className="mt-2 flex items-center gap-2">
                <img src={pendingPhoto.previewUrl} alt="" className="h-14 w-14 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => setPendingPhoto(null)}
                  className="cursor-pointer text-xs text-neutral-500 underline decoration-dotted hover:text-red-500 dark:text-neutral-400"
                >
                  {t("carnet.notes.removePhoto")}
                </button>
              </div>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAdd}
                disabled={!draft.trim()}
                className="cursor-pointer rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-amber-600 dark:text-neutral-950 dark:hover:bg-amber-500"
              >
                {t("carnet.notes.addButton")}
              </button>

              {dictationSupported && (
                <button
                  type="button"
                  onClick={toggleDictation}
                  aria-pressed={listening}
                  title={t("carnet.notes.voiceHint")}
                  className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border transition ${
                    listening
                      ? "border-red-400 bg-red-50 text-red-600 dark:border-red-500 dark:bg-red-950 dark:text-red-400"
                      : "border-neutral-300 text-neutral-600 hover:border-amber-400 hover:text-amber-700 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-amber-500 dark:hover:text-amber-400"
                  }`}
                >
                  <MicIcon />
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  handlePhotoSelected(file);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoBusy}
                title={t("carnet.notes.photoHint")}
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-neutral-300 text-neutral-600 transition hover:border-amber-400 hover:text-amber-700 disabled:cursor-wait disabled:opacity-60 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-amber-500 dark:hover:text-amber-400"
              >
                <CameraIcon />
              </button>

              {listening && (
                <span className="text-xs text-red-600 dark:text-red-400">{t("carnet.notes.listening")}</span>
              )}
            </div>
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            {t("carnet.notes.historyTitle", { count: entries.length })}
          </p>
          {entries.length === 0 ? (
            <p className="text-xs text-neutral-400 dark:text-neutral-500">{t("carnet.notes.noHistory")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {entries.map((entry) => (
                <li key={entry.id} className="rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-800">
                  <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                    {new Date(entry.date).toLocaleDateString(locale, {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="mt-0.5 text-sm text-neutral-700 dark:text-neutral-200">{entry.text}</p>
                  {entry.photoId && <PhotoThumbnail photoId={entry.photoId} />}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
