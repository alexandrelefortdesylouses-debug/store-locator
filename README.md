# Store Locator

Application web de localisation de magasins (React + TailwindCSS + Leaflet).

## Lancer le projet

```bash
npm install
npm run dev
```

Build de production :

```bash
npm run build
npm run preview
```

## Données des magasins

Les magasins affichés sont définis dans `public/stores.json`. Le fichier fourni
contient 5 magasins fictifs en France, à titre de démonstration. Pour utiliser
vos propres données, remplacez ce fichier en conservant la même structure :

```json
{
  "id": "identifiant-unique",
  "name": "Nom du magasin",
  "address": "Adresse complète",
  "lat": 48.8532,
  "lng": 2.3708,
  "hours": {
    "lundi": "10h00 - 19h00",
    "mardi": "10h00 - 19h00",
    "...": "..."
  }
}
```

## Avis clients et code secret

Chaque fiche magasin affiche une section d'avis clients. Le formulaire
d'ajout d'avis est protégé par un code secret (par défaut : `1234`).

- Les avis sont enregistrés dans le `localStorage` du navigateur (par magasin).
- Le code secret peut être modifié à tout moment via le bouton
  **⚙️ Paramètres** en haut de la page (il faut connaître le code actuel pour
  le changer).
- Le code est stocké dans le `localStorage` de l'appareil : il est donc propre
  à chaque navigateur/appareil utilisé pour administrer le site.

> Pour une mise en production réelle avec des avis partagés entre tous les
> visiteurs, il faudra remplacer le stockage `localStorage` par une API/backend.
