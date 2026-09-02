"""Récupère les derniers titres RSS pour trois rubriques — Politique,
Économie, Sport (hors football) — en mélangeant France et international pour
les deux premières, et les affiche en JSON sur stdout.

Ne fait aucun appel IA ni envoi d'e-mail — cette étape est volontairement
séparée pour que la synthèse soit faite par Claude Code lui-même (sans clé
API Anthropic payante) et l'envoi par send_email.py.
"""

import json
import re
import sys

import feedparser

_TAG_RE = re.compile(r"<[^>]+>")

_SOURCE_NAMES = {
    "lemonde.fr": "Le Monde",
    "lequipe.fr": "L'Équipe",
    "franceinfo.fr": "France Info",
    "francetvinfo.fr": "France Info",
}


def _strip_html(text):
    return _TAG_RE.sub("", text).strip()


def _source_name(link):
    for domain, name in _SOURCE_NAMES.items():
        if domain in link:
            return name
    return "Source inconnue"


# Chaque rubrique combine plusieurs flux (France + international, et
# plusieurs médias pour éviter de dépendre d'une seule ligne éditoriale).
SOURCES = {
    "Politique": [
        ("France", "https://www.lemonde.fr/politique/rss_full.xml"),
        ("France", "https://www.francetvinfo.fr/politique.rss"),
        ("Monde", "https://www.lemonde.fr/international/rss_full.xml"),
        ("Monde", "https://www.francetvinfo.fr/monde.rss"),
    ],
    "Économie": [
        ("France / Monde", "https://www.lemonde.fr/economie/rss_full.xml"),
        ("France / Monde", "https://www.francetvinfo.fr/economie.rss"),
    ],
    "Sport (hors football)": [
        ("France / Monde", "https://dwh.lequipe.fr/api/edito/rss?path=/"),
        ("France / Monde", "https://www.francetvinfo.fr/sports.rss"),
    ],
}

ENTRIES_PER_FEED = 10

# Filtre grossier pour exclure le football du flux sport généraliste.
_FOOTBALL_RE = re.compile(r"football|/Football/|ligue 1|ligue 2|champions league|coupe de france", re.IGNORECASE)


def _fetch_feed(url):
    feed = feedparser.parse(url)
    if feed.bozo and not feed.entries:
        print(f"Attention : impossible de lire le flux ({url}): {feed.bozo_exception}", file=sys.stderr)
        return []
    return feed.entries[:ENTRIES_PER_FEED]


def fetch_headlines():
    headlines = {}
    for category, feeds in SOURCES.items():
        items = []
        for origin, url in feeds:
            for entry in _fetch_feed(url):
                link = entry.get("link", "")
                title = _strip_html(entry.get("title", ""))

                if category == "Sport (hors football)" and _FOOTBALL_RE.search(f"{title} {link}"):
                    continue

                items.append(
                    {
                        "origine": origin,
                        "source": _source_name(link),
                        "title": title,
                        "summary": _strip_html(entry.get("summary", "")),
                        "link": link,
                    }
                )
        headlines[category] = items
    return headlines


if __name__ == "__main__":
    print(json.dumps(fetch_headlines(), ensure_ascii=False, indent=2))
