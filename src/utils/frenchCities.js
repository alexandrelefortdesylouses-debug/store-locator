export const MAJOR_CITIES = [
  "Paris",
  "Marseille",
  "Lyon",
  "Toulouse",
  "Nice",
  "Nantes",
  "Montpellier",
  "Strasbourg",
  "Bordeaux",
  "Lille",
  "Rennes",
  "Reims",
  "Toulon",
  "Grenoble",
  "Dijon",
  "Angers",
  "Nîmes",
  "Saint-Étienne",
  "Le Havre",
  "Clermont-Ferrand",
];

export function sortCitiesWithMajorFirst(cities) {
  const remaining = new Set(cities);
  const major = MAJOR_CITIES.filter((city) => remaining.has(city));
  major.forEach((city) => remaining.delete(city));
  const others = [...remaining].sort();
  return { major, others };
}
