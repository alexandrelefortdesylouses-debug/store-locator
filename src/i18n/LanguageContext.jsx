import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations } from "./translations";

const LANGUAGE_KEY = "storeLocator_lang";
const LanguageContext = createContext(null);

function interpolate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] !== undefined ? vars[key] : `{${key}}`,
  );
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(
    () => localStorage.getItem(LANGUAGE_KEY) || "fr",
  );

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, lang);
  }, [lang]);

  const value = useMemo(() => {
    function t(key, vars = {}) {
      const dict = translations[lang] || translations.fr;
      const count = vars.count;
      const pluralKey = `${key}_plural`;
      let template =
        typeof count === "number" && count > 1 && dict[pluralKey]
          ? dict[pluralKey]
          : dict[key];

      if (template === undefined) {
        template = translations.fr[key] ?? key;
      }
      return interpolate(template, vars);
    }

    return { lang, setLang, t };
  }, [lang]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
