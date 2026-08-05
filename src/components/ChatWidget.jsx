import { useEffect, useRef, useState } from "react";
import { answerQuestion } from "../utils/chatbot";
import { useLanguage } from "../i18n/LanguageContext";

function ChatBubbleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

export default function ChatWidget({ stores }) {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => [
    { role: "bot", text: t("chat.welcome") },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    setMessages((prev) =>
      prev.length === 1 && prev[0].role === "bot"
        ? [{ role: "bot", text: t("chat.welcome") }]
        : prev,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  function handleSend(e) {
    e.preventDefault();
    const question = input.trim();
    if (!question) return;

    const reply = answerQuestion(question, stores, lang);
    setMessages((prev) => [
      ...prev,
      { role: "user", text: question },
      { role: "bot", text: reply },
    ]);
    setInput("");
  }

  return (
    <div className="fixed bottom-4 right-4 z-[1000] flex flex-col items-end gap-3 sm:bottom-5 sm:right-5">
      {open && (
        <div className="flex h-[70vh] max-h-[480px] w-[340px] max-w-[90vw] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900">
          <div className="flex items-center justify-between bg-neutral-950 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-200/40 font-serif text-sm text-amber-200">
                T
              </span>
              <div className="leading-tight">
                <p className="text-sm font-medium text-white">Assistant Thélios</p>
                <p className="text-[10px] uppercase tracking-wide text-amber-200/70">
                  {t("chat.online")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="cursor-pointer rounded-full p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              aria-label={t("chat.closeAria")}
            >
              ✕
            </button>
          </div>

          <p className="shrink-0 border-b border-neutral-200 bg-neutral-50 px-4 py-1.5 text-center text-[10px] uppercase tracking-wide text-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-500">
            {t("chat.scopeHint")}
          </p>

          <div
            ref={scrollRef}
            className="thin-scrollbar flex-1 space-y-3 overflow-y-auto bg-neutral-50 p-4 dark:bg-neutral-950"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <p
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-neutral-900 text-white dark:bg-amber-600 dark:text-neutral-950"
                      : "border border-neutral-200 bg-white text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                  }`}
                >
                  {msg.text}
                </p>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-neutral-200 p-3 dark:border-neutral-700"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("chat.inputPlaceholder")}
              className="flex-1 rounded-full border border-neutral-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-neutral-600 dark:text-neutral-100"
            />
            <button
              type="submit"
              className="cursor-pointer rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 dark:bg-amber-600 dark:text-neutral-950 dark:hover:bg-amber-500"
            >
              {t("chat.send")}
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-13 w-13 cursor-pointer items-center justify-center rounded-full bg-neutral-950 text-amber-200 shadow-xl transition hover:bg-neutral-800 sm:h-14 sm:w-14"
        aria-label={open ? t("chat.closeAria") : t("chat.openAria")}
      >
        {open ? <span className="text-xl leading-none">✕</span> : <ChatBubbleIcon />}
      </button>
    </div>
  );
}
