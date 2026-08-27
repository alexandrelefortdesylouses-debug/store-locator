const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");
const REGEX_ESCAPE_REGEX = /[.*+?^${}()|[\]\\]/g;
const POSTAL_CODE_REGEX = /\b\d{5}\b/;
const HOURS_KEYWORDS_REGEX = /horaire|ouvert|ferme|heure|hours?|opening|closed?/;
const MAX_RESULTS = 8;

const STRINGS = {
  fr: {
    loading: "Les données des opticiens sont en cours de chargement, réessayez dans un instant.",
    noHours: "Horaires non renseignés, contactez directement l'opticien.",
    brandsLabel: "Marques",
    hoursOf: (name) => `Horaires de ${name} :`,
    storeInfo: (store) =>
      `${store.name} se trouve au ${store.address}.\nMarques disponibles : ${store.brands.join(", ")}.\nDemandez-moi ses horaires si besoin !`,
    andMore: (n) => `… et ${n} autre${n > 1 ? "s" : ""}. Affinez avec une ville ou une marque pour préciser.`,
    postalOpticians: (code) => `Opticiens au code postal ${code} :`,
    noPostal: (code) => `Je n'ai pas d'opticien au code postal ${code} pour le moment.`,
    cityOpticians: (city, label) => `Opticiens à ${city}${label} :`,
    noCity: (city, label) => `Je n'ai pas d'opticien à ${city}${label} pour le moment.`,
    distributing: (brand) => ` distribuant ${brand}`,
    brandOpticians: (brand) => `Opticiens distribuant ${brand} :`,
    noBrand: (brand) => `Aucun opticien ne distribue actuellement ${brand}.`,
    askHoursHint: 'Indiquez-moi le nom ou la ville de la boutique pour connaître ses horaires, par exemple : "Horaires du magasin de Lyon ?"',
    fallback: 'Je peux vous aider à trouver un opticien par ville, code postal ou marque. Essayez par exemple : "Quels opticiens à Lyon ?", "Où trouver Julbo ?" ou "Horaires de la boutique de Nice ?"',
  },
  en: {
    loading: "Optician data is still loading, please try again in a moment.",
    noHours: "Opening hours not provided, please contact the optician directly.",
    brandsLabel: "Brands",
    hoursOf: (name) => `Opening hours for ${name}:`,
    storeInfo: (store) =>
      `${store.name} is located at ${store.address}.\nBrands available: ${store.brands.join(", ")}.\nAsk me for its opening hours if needed!`,
    andMore: (n) => `… and ${n} more. Narrow it down with a city or a brand.`,
    postalOpticians: (code) => `Opticians at postal code ${code}:`,
    noPostal: (code) => `I don't have an optician at postal code ${code} right now.`,
    cityOpticians: (city, label) => `Opticians in ${city}${label}:`,
    noCity: (city, label) => `I don't have an optician in ${city}${label} right now.`,
    distributing: (brand) => ` carrying ${brand}`,
    brandOpticians: (brand) => `Opticians carrying ${brand}:`,
    noBrand: (brand) => `No optician currently carries ${brand}.`,
    askHoursHint: 'Tell me the name or city of the shop to get its opening hours, e.g. "Opening hours for the Lyon shop?"',
    fallback: 'I can help you find an optician by city, postal code or brand. Try for example: "Which opticians in Lyon?", "Where to find Julbo?" or "Opening hours for the Nice shop?"',
  },
};

function normalize(text) {
  return text.normalize("NFD").replace(DIACRITICS_REGEX, "").toLowerCase();
}

function escapeRegex(text) {
  return text.replace(REGEX_ESCAPE_REGEX, "\\$&");
}

// Matches `term` inside `query` on whole-word boundaries, so a short store
// name like "Optica" doesn't spuriously match inside an unrelated word like
// "opticians".
function includesWord(query, term) {
  if (!term) return false;
  return new RegExp(`\\b${escapeRegex(term)}\\b`).test(query);
}

function formatHours(hours, s) {
  if (!hours || Object.keys(hours).length === 0) {
    return s.noHours;
  }
  return Object.entries(hours)
    .map(([day, value]) => `${day[0].toUpperCase()}${day.slice(1)} : ${value}`)
    .join("\n");
}

function formatStoreLine(store, s) {
  return `• ${store.name} — ${store.address}\n  ${s.brandsLabel} : ${store.brands.join(", ")}`;
}

function formatStoreList(stores, s) {
  const shown = stores.slice(0, MAX_RESULTS).map((store) => formatStoreLine(store, s)).join("\n");
  const remaining = stores.length - MAX_RESULTS;
  if (remaining > 0) {
    return `${shown}\n${s.andMore(remaining)}`;
  }
  return shown;
}

export function answerQuestion(question, stores, lang = "fr") {
  const s = STRINGS[lang] || STRINGS.fr;
  const query = normalize(question);

  if (stores.length === 0) {
    return s.loading;
  }

  const allBrands = [...new Set(stores.flatMap((store) => store.brands))];
  const brandMatch = allBrands.find((brand) => includesWord(query, normalize(brand)));
  const cityMatch = stores.find((store) => includesWord(query, normalize(store.city)));
  const postalMatch = question.match(POSTAL_CODE_REGEX);
  const asksHours = HOURS_KEYWORDS_REGEX.test(query);

  // A store name only counts as a match if it uniquely identifies one shop
  // (many chain names like "Krys" or "Optic 2000" repeat hundreds of times),
  // optionally narrowed down by a city also mentioned in the question.
  const nameMatches = stores.filter((store) => includesWord(query, normalize(store.name)));
  let storeMatch = nameMatches.length === 1 ? nameMatches[0] : null;
  if (!storeMatch && nameMatches.length > 1 && cityMatch) {
    const narrowed = nameMatches.filter(
      (store) => normalize(store.city) === normalize(cityMatch.city),
    );
    if (narrowed.length === 1) storeMatch = narrowed[0];
  }

  if (storeMatch && asksHours) {
    return `${s.hoursOf(storeMatch.name)}\n${formatHours(storeMatch.hours, s)}`;
  }

  if (storeMatch) {
    return s.storeInfo(storeMatch);
  }

  if (cityMatch && asksHours) {
    const inCity = stores.filter(
      (store) => normalize(store.city) === normalize(cityMatch.city),
    );
    if (inCity.length > 0) {
      return inCity
        .slice(0, MAX_RESULTS)
        .map((store) => `${s.hoursOf(store.name)}\n${formatHours(store.hours, s)}`)
        .join("\n\n");
    }
  }

  if (postalMatch) {
    const matches = stores.filter((store) => store.address.includes(postalMatch[0]));
    if (matches.length > 0) {
      return `${s.postalOpticians(postalMatch[0])}\n${formatStoreList(matches, s)}`;
    }
    return s.noPostal(postalMatch[0]);
  }

  if (cityMatch) {
    const city = cityMatch.city;
    const inCity = stores.filter((store) => normalize(store.city) === normalize(city));
    const filtered = brandMatch
      ? inCity.filter((store) => store.brands.includes(brandMatch))
      : inCity;

    const label = brandMatch ? s.distributing(brandMatch) : "";
    if (filtered.length > 0) {
      return `${s.cityOpticians(city, label)}\n${formatStoreList(filtered, s)}`;
    }
    return s.noCity(city, label);
  }

  if (brandMatch) {
    const matches = stores.filter((store) => store.brands.includes(brandMatch));
    if (matches.length > 0) {
      return `${s.brandOpticians(brandMatch)}\n${formatStoreList(matches, s)}`;
    }
    return s.noBrand(brandMatch);
  }

  if (asksHours) {
    return s.askHoursHint;
  }

  return s.fallback;
}
