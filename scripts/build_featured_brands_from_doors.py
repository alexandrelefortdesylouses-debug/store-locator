import json
import re
import sys
import time
import urllib.parse
import urllib.request

import openpyxl

EXCEL_PATH = "TH5584C Doors Master data (75).xlsx"
STORES_PATH = "public/stores.json"
CACHE_PATH = "scripts/.geocode_cache_doors.json"

BRAND_LABELS = {
    "VU": "Vuarnet",
    "BP": "Barton Perreira",
}

LOWERCASE_PARTICLES = {"de", "du", "des", "la", "le", "les", "d", "l", "et", "sur", "en"}


def norm(value):
    if value is None:
        return ""
    return str(value).strip()


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
    return text or "door"


def load_cache():
    try:
        with open(CACHE_PATH, "r", encoding="utf-8") as f:
            raw = json.load(f)
        return {k: (tuple(v) if v is not None else None) for k, v in raw.items()}
    except FileNotFoundError:
        return {}


def save_cache(cache):
    with open(CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(cache, f)


def geocode(query, retries=3):
    params = {"q": query, "limit": 1}
    url = f"https://api-adresse.data.gouv.fr/search/?{urllib.parse.urlencode(params)}"
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(url, timeout=15) as response:
                data = json.load(response)
            features = data.get("features") or []
            if not features:
                return None
            lng, lat = features[0]["geometry"]["coordinates"]
            return (lat, lng)
        except Exception as exc:  # noqa: BLE001
            if attempt == retries - 1:
                print(f"  geocode failed for {query!r}: {exc}", file=sys.stderr)
            else:
                time.sleep(1.5 * (attempt + 1))
    return None


def geocode_store(street, zip_code, city, cache):
    full_query = f"{street}, {zip_code} {city}"
    key = full_query.lower()
    if key in cache:
        return cache[key]

    result = geocode(full_query)
    if not result:
        result = geocode(f"{zip_code} {city}")
    if not result:
        result = geocode(city)

    cache[key] = result
    return result


def main():
    wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True, read_only=True)
    ws = wb["Doors Master Data"]

    header = None
    rows = []
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i == 0:
            continue
        if i == 1:
            header = [norm(h) for h in row]
            continue
        if row[0] is None and all(c is None for c in row):
            continue
        rows.append(dict(zip(header, row)))

    print(f"Total rows: {len(rows)}", file=sys.stderr)

    active_france = [
        r
        for r in rows
        if norm(r.get("Country Name")) == "France"
        and r.get("Date To") is not None
        and r["Date To"].year == 9999
    ]
    print(f"Active France rows (Date To = 9999): {len(active_france)}", file=sys.stderr)

    doors = {}
    for r in active_france:
        door_code = norm(r.get("Door Code"))
        brand_code = norm(r.get("Brand"))
        brand = BRAND_LABELS.get(brand_code)
        if not door_code or not brand:
            continue

        if door_code not in doors:
            doors[door_code] = {
                "name": titleize(norm(r.get("Door Name"))),
                "street": titleize(norm(r.get("Street"))),
                "city": titleize(norm(r.get("City"))),
                "zip": norm(r.get("Zip")),
                "phone": norm(r.get("Phone")),
                "email": norm(r.get("Email Default")),
                "brands": set(),
            }
        doors[door_code]["brands"].add(brand)

    print(f"Unique doors: {len(doors)}", file=sys.stderr)

    cache = load_cache()
    results = []
    for i, (door_code, door) in enumerate(doors.items()):
        coords = geocode_store(door["street"], door["zip"], door["city"], cache)
        if (i + 1) % 100 == 0:
            print(f"  geocoded {i + 1}/{len(doors)}", file=sys.stderr)
            save_cache(cache)
        if not coords:
            continue
        lat, lng = coords

        entry = {
            "id": f"door-{door_code}",
            "name": door["name"] or f"Opticien {door_code}",
            "address": f"{door['street']}, {door['zip']} {door['city']}",
            "city": door["city"],
            "country": "France",
            "lat": round(lat, 5),
            "lng": round(lng, 5),
            "brands": sorted(door["brands"]),
        }
        if door["phone"]:
            entry["phone"] = door["phone"]
        if door["email"]:
            entry["email"] = door["email"]

        results.append(entry)

    save_cache(cache)
    print(f"Geocoded doors: {len(results)} (skipped {len(doors) - len(results)})", file=sys.stderr)

    with open(STORES_PATH, "r", encoding="utf-8") as f:
        existing = json.load(f)

    existing_ids = {s["id"] for s in existing}
    new_entries = [e for e in results if e["id"] not in existing_ids]
    print(f"New entries to add: {len(new_entries)}", file=sys.stderr)

    combined = existing + new_entries
    with open(STORES_PATH, "w", encoding="utf-8") as f:
        json.dump(combined, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"Final stores.json size: {len(combined)}", file=sys.stderr)


if __name__ == "__main__":
    main()
