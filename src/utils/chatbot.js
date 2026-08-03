const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");
const POSTAL_CODE_REGEX = /\b\d{5}\b/;
const HOURS_KEYWORDS_REGEX = /horaire|ouvert|ferme|heure/;

function normalize(text) {
  return text.normalize("NFD").replace(DIACRITICS_REGEX, "").toLowerCase();
}

function extractCity(address) {
  const match = address.match(/\d{4,5}\s+(.+)$/);
  return match ? match[1].trim() : null;
}

function formatHours(hours) {
  return Object.entries(hours)
    .map(([day, value]) => `${day[0].toUpperCase()}${day.slice(1)} : ${value}`)
    .join("\n");
}

function formatStoreLine(store) {
  return `• ${store.name} — ${store.address}\n  Marques : ${store.brands.join(", ")}`;
}

export function answerQuestion(question, stores) {
  const query = normalize(question);

  if (stores.length === 0) {
    return "Les données des opticiens sont en cours de chargement, réessayez dans un instant.";
  }

  const allBrands = [...new Set(stores.flatMap((store) => store.brands))];
  const brandMatch = allBrands.find((brand) => query.includes(normalize(brand)));
  const storeMatch = stores.find((store) => query.includes(normalize(store.name)));
  const cityMatch = stores
    .map((store) => ({ store, city: extractCity(store.address) }))
    .find(({ city }) => city && query.includes(normalize(city)));
  const postalMatch = question.match(POSTAL_CODE_REGEX);
  const asksHours = HOURS_KEYWORDS_REGEX.test(query);

  if (storeMatch && asksHours) {
    return `Horaires de ${storeMatch.name} :\n${formatHours(storeMatch.hours)}`;
  }

  if (storeMatch) {
    return `${storeMatch.name} se trouve au ${storeMatch.address}.\nMarques disponibles : ${storeMatch.brands.join(", ")}.\nDemandez-moi ses horaires si besoin !`;
  }

  if (cityMatch && asksHours) {
    const city = cityMatch.city;
    const inCity = stores.filter(
      (store) => normalize(extractCity(store.address) || "") === normalize(city),
    );
    if (inCity.length > 0) {
      return inCity
        .map((store) => `Horaires de ${store.name} :\n${formatHours(store.hours)}`)
        .join("\n\n");
    }
  }

  if (postalMatch) {
    const matches = stores.filter((store) => store.address.includes(postalMatch[0]));
    if (matches.length > 0) {
      return `Opticiens au code postal ${postalMatch[0]} :\n${matches.map(formatStoreLine).join("\n")}`;
    }
    return `Je n'ai pas d'opticien Thélios au code postal ${postalMatch[0]} pour le moment.`;
  }

  if (cityMatch) {
    const city = cityMatch.city;
    const inCity = stores.filter(
      (store) => normalize(extractCity(store.address) || "") === normalize(city),
    );
    const filtered = brandMatch
      ? inCity.filter((store) => store.brands.includes(brandMatch))
      : inCity;

    if (filtered.length > 0) {
      const label = brandMatch ? ` distribuant ${brandMatch}` : "";
      return `Opticiens à ${city}${label} :\n${filtered.map(formatStoreLine).join("\n")}`;
    }
    const label = brandMatch ? ` distribuant ${brandMatch}` : "";
    return `Je n'ai pas d'opticien Thélios à ${city}${label} pour le moment.`;
  }

  if (brandMatch) {
    const matches = stores.filter((store) => store.brands.includes(brandMatch));
    if (matches.length > 0) {
      return `Opticiens distribuant ${brandMatch} :\n${matches.map(formatStoreLine).join("\n")}`;
    }
    return `Aucun opticien ne distribue actuellement ${brandMatch}.`;
  }

  if (asksHours) {
    return 'Indiquez-moi le nom ou la ville de la boutique pour connaître ses horaires, par exemple : "Horaires du magasin de Lyon ?"';
  }

  const brandList = allBrands.join(", ");
  return `Je peux vous aider à trouver un opticien par ville, code postal ou marque (${brandList}). Essayez par exemple : "Quels opticiens à Lyon ?", "Où trouver Dior ?" ou "Horaires de la boutique de Bordeaux ?"`;
}
