import json
import re
import sys
import time
import urllib.parse
import urllib.request

import openpyxl

EXCEL_PATH = "SCRAPPING_DATABASE_SEPT 2025_AF_JMM+CARTIER+LINDBERG+SERENGETI+DITA+MAUIJIM+MYKITA+CHANEL+PORSCHE DESIGN+OAKLEY+JULBO.xlsx"
OUTPUT_PATH = "public/stores.json"

BRAND_LABELS = {
    "PORSCHE DESIGN": "Porsche Design",
    "OAKLEY": "Oakley",
    "JULBO": "Julbo",
    "CHANEL": "Chanel",
    "MYKITA": "Mykita",
    "MAUI JIM": "Maui Jim",
    "DITA": "Dita",
    "SERENGETI": "Serengeti",
    "LINDBERG": "Lindberg",
    "JMM": "JMM",
    "CARTIER": "Cartier",
    "THOM BROWNE": "Thom Browne",
    "THIERRY LASRY": "Thierry Lasry",
    "MOSCOT": "Moscot",
}

LOWERCASE_PARTICLES = {"de", "du", "des", "la", "le", "les", "d", "l", "et", "sur", "en"}


def norm(value):
    return str(value).strip() if value is not None else ""


def titleize(text):
    if not text:
        return text
    if not text.isupper():
        return text
    words = text.lower().split(" ")
    out = []
    for i, word in enumerate(words):
        core = re.sub(r"[^a-zàâäéèêëïîôöùûüç']", "", word)
        if i > 0 and core in LOWERCASE_PARTICLES:
            out.append(word)
        else:
            out.append(word[:1].upper() + word[1:] if word else word)
    return " ".join(out)


def dedup_key(name, city):
    n = re.sub(r"[^A-Z0-9]", "", norm(name).upper())
    c = re.sub(r"[^A-Z0-9]", "", norm(city).upper())
    return (n, c)


def slugify(text):
    text = norm(text).lower()
    text = (
        text.replace("é", "e").replace("è", "e").replace("ê", "e").replace("ë", "e")
        .replace("à", "a").replace("â", "a").replace("ä", "a")
        .replace("ô", "o").replace("ö", "o")
        .replace("ù", "u").replace("û", "u").replace("ü", "u")
        .replace("ç", "c").replace("î", "i").replace("ï", "i")
    )
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text or "store"


def geocode_city(city_name, cache):
    key = city_name.lower()
    if key in cache:
        return cache[key]
    query = urllib.parse.urlencode({"q": city_name, "type": "municipality", "limit": 1})
    url = f"https://api-adresse.data.gouv.fr/search/?{query}"
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            data = json.load(response)
        features = data.get("features") or []
        if not features:
            cache[key] = None
            return None
        lng, lat = features[0]["geometry"]["coordinates"]
        cache[key] = (lat, lng)
    except Exception as exc:  # noqa: BLE001
        print(f"  geocode failed for {city_name!r}: {exc}", file=sys.stderr)
        cache[key] = None
    return cache[key]


def main():
    wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True, read_only=True)

    stores = {}
    for sheet in wb.sheetnames:
        ws = wb[sheet]
        header = None
        for i, row in enumerate(ws.iter_rows(values_only=True)):
            if i == 0:
                header = [norm(h).lower() for h in row]
                continue
            if row[0] is None:
                continue
            d = dict(zip(header, row))
            country = norm(d.get("country"))
            if country.lower() != "france":
                continue
            name = norm(d.get("name"))
            city = norm(d.get("city") or d.get("city of industry"))
            if not name or not city:
                continue

            key = dedup_key(name, city)
            brand = BRAND_LABELS[sheet]
            if key not in stores:
                stores[key] = {
                    "name": titleize(name),
                    "city": titleize(city),
                    "address": norm(d.get("address")),
                    "phone": norm(d.get("phone") or d.get("phone number")),
                    "email": norm(d.get("email")),
                    "website": norm(d.get("website")),
                    "brands": [],
                }
            if brand not in stores[key]["brands"]:
                stores[key]["brands"].append(brand)

    print(f"Deduped France stores: {len(stores)}", file=sys.stderr)

    unique_cities = sorted({s["city"] for s in stores.values()})
    print(f"Unique cities to geocode: {len(unique_cities)}", file=sys.stderr)

    cache = {}
    for i, city in enumerate(unique_cities):
        geocode_city(city, cache)
        if (i + 1) % 100 == 0:
            print(f"  geocoded {i + 1}/{len(unique_cities)}", file=sys.stderr)

    result = []
    used_ids = set()
    skipped = 0
    for store in stores.values():
        coords = cache.get(store["city"].lower())
        if not coords:
            skipped += 1
            continue
        lat, lng = coords

        base_id = slugify(f"{store['name']}-{store['city']}")
        store_id = base_id
        suffix = 2
        while store_id in used_ids:
            store_id = f"{base_id}-{suffix}"
            suffix += 1
        used_ids.add(store_id)

        entry = {
            "id": store_id,
            "name": store["name"],
            "address": store["address"] or f"{store['city']}, France",
            "city": store["city"],
            "country": "France",
            "lat": round(lat, 5),
            "lng": round(lng, 5),
            "brands": sorted(store["brands"]),
        }
        if store["phone"]:
            entry["phone"] = store["phone"]
        if store["email"]:
            entry["email"] = store["email"]
        if store["website"]:
            entry["website"] = store["website"]

        result.append(entry)

    result.sort(key=lambda s: (s["city"], s["name"]))

    print(f"Skipped (no geocode): {skipped}", file=sys.stderr)
    print(f"Final store count: {len(result)}", file=sys.stderr)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
        f.write("\n")


if __name__ == "__main__":
    main()
