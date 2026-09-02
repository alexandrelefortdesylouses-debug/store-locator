# Newsletter quotidienne (Monde / France / Sport)

Automation gratuite (pas d'appel API Anthropic payant) :

1. `fetch_news.py` récupère les derniers titres RSS (Le Monde, L'Équipe) et les affiche en JSON.
2. Claude Code lit ce JSON et rédige lui-même la newsletter (`newsletter.html`) — c'est l'étape de synthèse, faite dans la conversation, sans clé API séparée.
3. `send_email.py newsletter.html` envoie ce fichier par e-mail via Resend (plan gratuit).

## Installation

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env   # puis renseigner RESEND_API_KEY et EMAIL_TO
```

## Exécution manuelle

```bash
.venv/bin/python fetch_news.py > news.json
# demander à Claude Code de rédiger newsletter.html à partir de news.json
.venv/bin/python send_email.py newsletter.html
```

## Variables d'environnement (`.env`, jamais commité)

- `RESEND_API_KEY` — clé API Resend (https://resend.com/api-keys)
- `EMAIL_TO` — adresse destinataire
- `FROM_EMAIL` — expéditeur (par défaut `onboarding@resend.dev`)
- `EMAIL_SUBJECT` — objet de l'e-mail (optionnel)
