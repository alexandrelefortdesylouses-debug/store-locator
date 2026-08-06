"""One-off data-correction pass for a batch of opticians with wrong postal
codes (and therefore wrong region assignment, since region/department are
derived at runtime from the postal code embedded in `address` — see
src/utils/regions.js, src/utils/departments.js, src/utils/postalCode.js)
and/or wrong GPS coordinates.

Two distinct bug classes were involved:
  1. A "BP <digits>" postal-box reference earlier in the address being
     mistaken for the postal code by the app's zip-extraction regex (fixed
     at the source in src/utils/postalCode.js — this script also cleans
     the BP number out of the address text itself for a tidier display).
  2. Genuine data-entry typos (wrong postal code digits) and/or bad
     historical geocoding (pin landing on an unrelated homonymous place).

Run once from the repo root: `python3 scripts/fix_region_geocode_errors.py`.
Re-geocodes only the affected store ids, leaves the rest of stores.json
untouched, and reuses the existing geocode cache
(scripts/.geocode_cache.json) so re-running is cheap.
"""
import json
import re
import sys
import time
import urllib.parse
import urllib.request

STORES_PATH = "public/stores.json"
CACHE_PATH = "scripts/.geocode_cache.json"

# id -> (new_address, new_city_or_None)
FIXES = {
    "modoptic-vienne": (
        "CHEMIN DES LONES CC LECLERC, VIENNE, Isère, 38200", None,
    ),
    "ekosport-sas-2f-epagny": (
        "252 RUE DU CENTRE, 74330, EPAGNY", None,
    ),
    "martin-sport-le-sauze": (
        "MARTIN JACQUES ALBAN, 04400, LE SAUZE", None,
    ),
    "sas-avalanche-ski-shop-vars": (
        "SAS AVALANCHE SKI SHOP, CENTRE VARS, 05560, VARS", None,
    ),
    "sport-et-loisirs-cda-sud-ouest-ibos": (
        "CENTRE COMMERCIAL MERIDIEN, ROUTE DE PAU, 65429, IBOS", None,
    ),
    "les-lunettes-de-cecile-nimes": (
        "21 bis rue de la madeleine, 30000, Nimes", None,
    ),
    "les-opticiens-krys-saint-die": (
        "CENTRE COMMERCIAL LECLERC, ZA HELLIEULE 2, 88100, SAINT DIE", None,
    ),
    "optique-nageleisen-saint-louis": (
        "OPTIQUE MODERNE, 5 AVENUE DE BÂLE, 68306, SAINT LOUIS", None,
    ),
    "st-louis-sport-et-loisir-intersport-saint-louis": (
        "6 RUE DE SEVILLE, ZONE DES PECHEURS, INTERSPORT, 68304, SAINT LOUIS", None,
    ),
    "vision-2000-sarl-bouzonville": (
        "OPTIC 2000, 47 RUE REPUBLIQUE, 57320, BOUZONVILLE", None,
    ),
    "door-0000721872": (
        "28 Rue Queuleu, 57070 Metz", None,
    ),
    "chaton-motrcycles-remiremont": (
        "16 PLACE JULES MELINE, 88204, REMIREMONT", None,
    ),
    "door-0000705887": (
        "72 Rue de la Liberte, 21000 Dijon", None,
    ),
    "mod-optic-orleans-orleans": (
        "5 Rue Du Vieux Marche, Orleans, 45000", None,
    ),
    "edgard-opticiens-reims-reims": (
        "16-18 Rue de Talleyrand, Reims, 51100", None,
    ),
    "royer-decaf-paridis-nantes": (
        "SARL ROYER DECAF, CCIAL PARIDIS RTE DE PARIS, 44300, NANTES", None,
    ),
    "anjou-optique-optic-libre-angers": (
        "23 Rue D Alsace, 49000 Angers, France", None,
    ),
    "dg-optique-roissy-roissy-cdg": (
        "LE DOME 4 RUE DE LA HAYE, ROISSY CDG, Val-d'Oise, 95731", None,
    ),
    "solaris-roissy-en-france-roissy-en-france": (
        "Aéroport Cdg 2 - Terminal S4 Roissy Charles De Gaulle, Roissy-En-France, 95716", None,
    ),
    "grand-optical-arcades-arcades": (
        "Ccr Les Arcades Niveau Bas - Boite 104, 93193 Noisy-le-Grand", "Noisy-le-Grand",
    ),
    "optique-guez-neuilly-neuilly": (
        "48 Avenue Du Général De Gaulle, 92200 Neuilly-sur-Seine", "Neuilly-sur-Seine",
    ),
    "optique-audio-assistance-asnieres-asnieres": (
        "90 Rue Des Bourguignons, 92500 Asnières-sur-Seine", "Asnières-sur-Seine",
    ),
    "lissac-opticiens-la-ville-du-bois": (
        "C Ccial Carrefour, 91620 La Ville du Bois, France", None,
    ),
    "grand-optical-belle-epine-belle-epine": (
        "Ccr Belle-Epine 148 Niveau Bas - Allée Principale, 94511 Thiais", "Thiais",
    ),
    "lissac-opticiens-clamart": (
        "OPTIQUE DE LA PLAINE SAS, 12 PLACE AIME CESAIRE, CENTRE COMMERCIAL PLAINE, 92140, CLAMART", None,
    ),
    "a-j-optique-grand-optical-granville": (
        "Route de Villedieu C C Leclerc, 50400 Granville, France", None,
    ),
}

ZIP_REGEX = re.compile(r"\b(\d{5})\b")
BP_NUMBER_REGEX = re.compile(r"\bBP\.?\s*\d+", re.IGNORECASE)


def expected_zip(address):
    cleaned = BP_NUMBER_REGEX.sub("", address)
    matches = ZIP_REGEX.findall(cleaned)
    return matches[-1] if matches else None


def expected_dept(zip_code):
    if not zip_code:
        return None
    return zip_code[:3] if zip_code.startswith(("97", "98")) else zip_code[:2]


def geocode_query(query_text, retries=3):
    query = urllib.parse.urlencode({"q": query_text, "limit": 1})
    url = f"https://api-adresse.data.gouv.fr/search/?{query}"
    last_error = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(url, timeout=15) as response:
                data = json.load(response)
            features = data.get("features") or []
            if not features:
                return None
            props = features[0]["properties"]
            lng, lat = features[0]["geometry"]["coordinates"]
            return (lat, lng, props.get("postcode"))
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            time.sleep(1.5 * (attempt + 1))
    print(f"  geocode failed for {query_text!r}: {last_error}", file=sys.stderr)
    return None


def resolve(address, city):
    zip_code = expected_zip(address)
    expected = expected_dept(zip_code)
    query = address if city.lower() in address.lower() else f"{address}, {city}"

    result = geocode_query(query)
    if result:
        _, _, postcode = result
        if expected and expected_dept(postcode) != expected:
            result = None
    if not result and query.lower() != city.lower():
        result = geocode_query(f"{zip_code} {city}" if zip_code else city)
    if not result:
        return None
    lat, lng, _ = result
    return (lat, lng)


def main():
    with open(STORES_PATH, encoding="utf-8") as f:
        stores = json.load(f)

    by_id = {s["id"]: s for s in stores}
    missing = [sid for sid in FIXES if sid not in by_id]
    if missing:
        print(f"ERROR: unknown store ids: {missing}", file=sys.stderr)
        sys.exit(1)

    updated = 0
    for store_id, (new_address, new_city) in FIXES.items():
        store = by_id[store_id]
        old_address, old_city = store["address"], store["city"]
        old_lat, old_lng = store.get("lat"), store.get("lng")

        store["address"] = new_address
        if new_city:
            store["city"] = new_city

        coords = resolve(store["address"], store["city"])
        if not coords:
            print(f"WARNING: geocode failed for {store_id} ({new_address!r}) — leaving previous coordinates", file=sys.stderr)
            continue

        lat, lng = coords
        store["lat"] = round(lat, 5)
        store["lng"] = round(lng, 5)
        updated += 1
        print(
            f"{store_id}: address {old_address!r} -> {new_address!r} | "
            f"city {old_city!r} -> {store['city']!r} | "
            f"coords ({old_lat}, {old_lng}) -> ({store['lat']}, {store['lng']})"
        )

    print(f"\nUpdated {updated}/{len(FIXES)} stores.", file=sys.stderr)

    with open(STORES_PATH, "w", encoding="utf-8") as f:
        json.dump(stores, f, ensure_ascii=False, indent=2)
        f.write("\n")


if __name__ == "__main__":
    main()
