"""Envoie un fichier HTML par e-mail via Resend.

Usage : python send_email.py newsletter.html

Par défaut, l'e-mail est planifié pour être délivré à DELIVERY_HOUR_LOCAL
(heure de DELIVERY_TZ) plutôt qu'envoyé immédiatement — utile quand le
script tourne tôt le matin (ex. 3h, pour ne pas empiéter sur l'usage
Claude de la journée) mais qu'on veut recevoir l'e-mail plus tard (ex. 8h).
Mettre EMAIL_SCHEDULE=false pour envoyer immédiatement (utile pour tester).
"""

import os
import sys
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import resend
from dotenv import load_dotenv

load_dotenv()

RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
EMAIL_TO = os.environ.get("EMAIL_TO")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "onboarding@resend.dev")
SUBJECT = os.environ.get("EMAIL_SUBJECT", "Info quotidienne")
SCHEDULE_DELIVERY = os.environ.get("EMAIL_SCHEDULE", "true").lower() != "false"
DELIVERY_HOUR_LOCAL = int(os.environ.get("DELIVERY_HOUR_LOCAL", "8"))
DELIVERY_TZ = os.environ.get("DELIVERY_TZ", "Europe/Paris")


def _next_delivery_time_utc():
    """Prochaine occurrence de DELIVERY_HOUR_LOCAL dans DELIVERY_TZ, en UTC."""
    tz = ZoneInfo(DELIVERY_TZ)
    now_local = datetime.now(tz)
    target = now_local.replace(hour=DELIVERY_HOUR_LOCAL, minute=0, second=0, microsecond=0)
    if target <= now_local:
        target += timedelta(days=1)
    return target.astimezone(ZoneInfo("UTC")).strftime("%Y-%m-%dT%H:%M:%S.000Z")


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

    params = {
        "from": FROM_EMAIL,
        "to": [EMAIL_TO],
        "subject": SUBJECT,
        "html": html_content,
    }

    if SCHEDULE_DELIVERY:
        params["scheduled_at"] = _next_delivery_time_utc()

    resend.api_key = RESEND_API_KEY
    result = resend.Emails.send(params)

    if SCHEDULE_DELIVERY:
        print(f"E-mail planifié pour {EMAIL_TO} à {params['scheduled_at']} (UTC) : {result}")
    else:
        print(f"E-mail envoyé à {EMAIL_TO} : {result}")


if __name__ == "__main__":
    main()
