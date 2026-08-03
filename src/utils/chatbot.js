const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");
const POSTAL_CODE_REGEX = /\b\d{5}\b/;
const HOURS_KEYWORDS_REGEX = /horaire|ouvert|ferme|heure/;
const MAX_RESULTS = 8;

function normalize(text) {
  return text.normalize("NFD").replace(DIACRITICS_REGEX, "").toLowerCase();
}

function formatHours(hours) {
  if (!hours || Object.keys(hours).length === 0) {
    return "Horaires non renseignés, contactez directement l'opticien.";
  }
  return Object.entries(hours)
    .map(([day, value]) => `${day[0].toUpperCase()}${day.slice(1)} : ${value}`)
    .join("\n");
}

function formatStoreLine(store) {
  return `• ${store.name} — ${store.address}\n  Marques : ${store.brands.join(", ")}`;
}

function formatStoreList(stores) {
  const shown = stores.slice(0, MAX_RESULTS).map(formatStoreLine).join("\n");
  const remaining = stores.length - MAX_RESULTS;
  if (remaining > 0) {
    return `${shown}\n… et ${remaining} autre${remaining > 1 ? "s" : ""}. Affinez avec une ville ou une marque pour préciser.`;
  }
  return shown;
}

export function answerQuestion(question, stores) {
  const query = normalize(question);

  if (stores.length === 0) {
    return "Les données des opticiens sont en cours de chargement, réessayez dans un instant.";
  }

  const allBrands = [...new Set(stores.flatMap((store) => store.brands))];
  const brandMatch = allBrands.find((brand) => query.includes(normalize(brand)));
  const storeMatch = stores.find((store) => query.includes(normalize(store.name)));
  const cityMatch = stores.find((store) => query.includes(normalize(store.city)));
  const postalMatch = question.match(POSTAL_CODE_REGEX);
  const asksHours = HOURS_KEYWORDS_REGEX.test(query);

  if (storeMatch && asksHours) {
    return `Horaires de ${storeMatch.name} :\n${formatHours(storeMatch.hours)}`;
  }

  if (storeMatch) {
    return `${storeMatch.name} se trouve au ${storeMatch.address}.\nMarques disponibles : ${storeMatch.brands.join(", ")}.\nDemandez-moi ses horaires si besoin !`;
  }

  if (cityMatch && asksHours) {
    const inCity = stores.filter(
      (store) => normalize(store.city) === normalize(cityMatch.city),
    );
    if (inCity.length > 0) {
      return inCity
        .slice(0, MAX_RESULTS)
        .map((store) => `Horaires de ${store.name} :\n${formatHours(store.hours)}`)
        .join("\n\n");
    }
  }

  if (postalMatch) {
    const matches = stores.filter((store) => store.address.includes(postalMatch[0]));
    if (matches.length > 0) {
      return `Opticiens au code postal ${postalMatch[0]} :\n${formatStoreList(matches)}`;
    }
    return `Je n'ai pas d'opticien Thélios au code postal ${postalMatch[0]} pour le moment.`;
  }

  if (cityMatch) {
    const city = cityMatch.city;
    const inCity = stores.filter((store) => normalize(store.city) === normalize(city));
    const filtered = brandMatch
      ? inCity.filter((store) => store.brands.includes(brandMatch))
      : inCity;

    const label = brandMatch ? ` distribuant ${brandMatch}` : "";
    if (filtered.length > 0) {
      return `Opticiens à ${city}${label} :\n${formatStoreList(filtered)}`;
    }
    return `Je n'ai pas d'opticien Thélios à ${city}${label} pour le moment.`;
  }

  if (brandMatch) {
    const matches = stores.filter((store) => store.brands.includes(brandMatch));
    if (matches.length > 0) {
      return `Opticiens distribuant ${brandMatch} :\n${formatStoreList(matches)}`;
    }
    return `Aucun opticien ne distribue actuellement ${brandMatch}.`;
  }

  if (asksHours) {
    return 'Indiquez-moi le nom ou la ville de la boutique pour connaître ses horaires, par exemple : "Horaires du magasin de Lyon ?"';
  }

  return `Je peux vous aider à trouver un opticien par ville, code postal ou marque. Essayez par exemple : "Quels opticiens à Lyon ?", "Où trouver Julbo ?" ou "Horaires de la boutique de Nice ?"`;
}
