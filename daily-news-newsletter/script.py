"""Automation quotidienne : récupère l'actualité (Monde, France, Sport) via
RSS, la synthétise en newsletter HTML avec Claude, puis l'envoie par e-mail
via Resend.
"""

import os
import sys

import feedparser
import resend
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
EMAIL_TO = os.environ.get("EMAIL_TO")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "onboarding@resend.dev")
ANTHROPIC_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-5")

# Une source par catégorie ; chacune est un flux RSS public.
RSS_FEEDS = {
    "Monde": "https://www.lemonde.fr/international/rss_full.xml",
    "France": "https://www.lemonde.fr/france/rss_full.xml",
    "Sport": "https://dwh.lequipe.fr/api/edito/rss?path=/",
}

ENTRIES_PER_CATEGORY = 6


def fetch_headlines():
    """Récupère les derniers titres de chaque flux RSS."""
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
                    "title": entry.get("title", "").strip(),
                    "summary": entry.get("summary", "").strip(),
                    "link": entry.get("link", ""),
                }
            )
        headlines[category] = items
    return headlines


def build_prompt(headlines):
    """Construit le prompt envoyé à Claude à partir des titres récupérés."""
    sections = []
    for category, items in headlines.items():
        if not items:
            continue
        lines = [f"## {category}"]
        for item in items:
            lines.append(f"- {item['title']} — {item['summary']} ({item['link']})")
        sections.append("\n".join(lines))

    raw_news = "\n\n".join(sections)

    return f"""Voici les derniers titres d'actualité du jour, regroupés par catégorie (Monde, France, Sport) :

{raw_news}

Rédige une newsletter quotidienne en HTML, claire et concise, à partir de ces informations.
Contraintes :
- Réponds UNIQUEMENT avec le code HTML de l'e-mail (pas de texte avant/après, pas de balises ```html).
- Structure avec un titre principal (date du jour non nécessaire), puis une section par catégorie (Monde, France, Sport).
- Pour chaque catégorie, 3 à 5 puces résumant les actualités les plus importantes en 1-2 phrases chacune, en français, sans jargon.
- Inclue un lien "En savoir plus" vers l'article quand pertinent.
- Utilise du CSS inline simple et sobre (pas de framework externe), lisible sur mobile comme sur desktop.
- Ne fabrique aucune information : reste fidèle aux titres et résumés fournis.
"""


def generate_newsletter_html(headlines):
    """Utilise Claude pour synthétiser les titres en newsletter HTML."""
    client = Anthropic(api_key=ANTHROPIC_API_KEY)

    message = client.messages.create(
        model=ANTHROPIC_MODEL,
        max_tokens=4096,
        messages=[{"role": "user", "content": build_prompt(headlines)}],
    )

    return message.content[0].text.strip()


def send_email(html_content):
    """Envoie la newsletter HTML par e-mail via Resend."""
    resend.api_key = RESEND_API_KEY

    params = {
        "from": FROM_EMAIL,
        "to": [EMAIL_TO],
        "subject": "Votre newsletter quotidienne — Monde, France, Sport",
        "html": html_content,
    }

    return resend.Emails.send(params)


def main():
    missing = [
        name
        for name, value in (
            ("ANTHROPIC_API_KEY", ANTHROPIC_API_KEY),
            ("RESEND_API_KEY", RESEND_API_KEY),
            ("EMAIL_TO", EMAIL_TO),
        )
        if not value
    ]
    if missing:
        print(f"Variables d'environnement manquantes : {', '.join(missing)}. Vérifiez votre fichier .env.", file=sys.stderr)
        sys.exit(1)

    print("Récupération des actualités (RSS)...")
    headlines = fetch_headlines()

    if not any(headlines.values()):
        print("Aucune actualité récupérée, arrêt.", file=sys.stderr)
        sys.exit(1)

    print("Synthèse de la newsletter avec Claude...")
    html_content = generate_newsletter_html(headlines)

    print(f"Envoi de l'e-mail à {EMAIL_TO} via Resend...")
    result = send_email(html_content)
    print(f"E-mail envoyé : {result}")


if __name__ == "__main__":
    main()
