"""Envoie un fichier HTML par e-mail via Resend.

Usage : python send_email.py newsletter.html
"""

import os
import sys

import resend
from dotenv import load_dotenv

load_dotenv()

RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
EMAIL_TO = os.environ.get("EMAIL_TO")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "onboarding@resend.dev")
SUBJECT = os.environ.get("EMAIL_SUBJECT", "Votre newsletter quotidienne — Monde, France, Sport")


def main():
    if len(sys.argv) != 2:
        print("Usage : python send_email.py <fichier.html>", file=sys.stderr)
        sys.exit(1)

    html_path = sys.argv[1]

    missing = [
        name
        for name, value in (("RESEND_API_KEY", RESEND_API_KEY), ("EMAIL_TO", EMAIL_TO))
        if not value
    ]
    if missing:
        print(f"Variables d'environnement manquantes : {', '.join(missing)}. Vérifiez votre fichier .env.", file=sys.stderr)
        sys.exit(1)

    with open(html_path, encoding="utf-8") as f:
        html_content = f.read()

    resend.api_key = RESEND_API_KEY
    result = resend.Emails.send(
        {
            "from": FROM_EMAIL,
            "to": [EMAIL_TO],
            "subject": SUBJECT,
            "html": html_content,
        }
    )
    print(f"E-mail envoyé à {EMAIL_TO} : {result}")


if __name__ == "__main__":
    main()
