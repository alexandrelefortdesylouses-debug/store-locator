"""Récupère les derniers titres RSS (Monde, France, Sport) et les affiche en
JSON sur stdout. Ne fait aucun appel IA ni envoi d'e-mail — cette étape est
volontairement séparée pour que la synthèse soit faite par Claude Code
lui-même (sans clé API Anthropic payante) et l'envoi par send_email.py.
"""

import json
import re
import sys

import feedparser

_TAG_RE = re.compile(r"<[^>]+>")


def _strip_html(text):
    return _TAG_RE.sub("", text).strip()

RSS_FEEDS = {
    "Monde": "https://www.lemonde.fr/international/rss_full.xml",
    "France": "https://www.lemonde.fr/politique/rss_full.xml",
    "Sport": "https://dwh.lequipe.fr/api/edito/rss?path=/",
}

ENTRIES_PER_CATEGORY = 6


def fetch_headlines():
    headlines = {}
    for category, url in RSS_FEEDS.items():
        feed = feedparser.parse(url)
        if feed.bozo and not feed.entries:
            print(f"Attention : impossible de lire le flux '{category}' ({url}): {feed.bozo_exception}", file=sys.stderr)
            headlines[category] = []
            continue

        items = []
        for entry in feed.entries[:ENTRIES_PER_CATEGORY]:
            items.append(
                {
                    "title": _strip_html(entry.get("title", "")),
                    "summary": _strip_html(entry.get("summary", "")),
                    "link": entry.get("link", ""),
                }
            )
        headlines[category] = items
    return headlines


if __name__ == "__main__":
    print(json.dumps(fetch_headlines(), ensure_ascii=False, indent=2))
