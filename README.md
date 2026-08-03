# Store Locator — Thélios / LVMH Eyewear

Application web de localisation d'opticiens partenaires (React + TailwindCSS + Leaflet).

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

## Interface

- **Carte interactive** en grand format, au centre de l'écran.
- **Sidebar escamotable** (bouton `‹ / ›`) avec recherche par ville/code postal,
  filtres par marque et liste des opticiens.
- **Fiche opticien** : un panneau détaillé s'ouvre au clic sur un opticien (dans
  la liste ou sur la carte), avec les marques distribuées, les horaires, un
  bouton d'itinéraire (Google Maps) et la section avis clients.

## Données des opticiens

Les opticiens affichés sont définis dans `public/stores.json`. Le fichier
fourni contient 5 opticiens fictifs en France, à titre de démonstration. Pour
utiliser vos propres données, remplacez ce fichier en conservant la même
structure :

```json
{
  "id": "identifiant-unique",
  "name": "Nom de l'opticien",
  "address": "Adresse complète",
  "lat": 48.8532,
  "lng": 2.3708,
  "brands": ["Dior", "Celine", "Fendi"],
  "hours": {
    "lundi": "10h00 - 19h00",
    "mardi": "10h00 - 19h00",
    "...": "..."
  }
}
```

Le filtre par marque de la sidebar est généré automatiquement à partir des
marques présentes dans ce fichier : il suffit d'ajouter/retirer des marques
dans `stores.json` pour que les filtres se mettent à jour.

## Avis clients et code secret

Chaque fiche opticien affiche une section d'avis clients. Le formulaire
d'ajout d'avis est protégé par un code secret (par défaut : `1234`).

- Les avis sont enregistrés dans le `localStorage` du navigateur (par magasin).
- Le code secret peut être modifié à tout moment via le bouton
  **Paramètres** en haut de la page (il faut connaître le code actuel pour
  le changer).
- Le code est stocké dans le `localStorage` de l'appareil : il est donc propre
  à chaque navigateur/appareil utilisé pour administrer le site.

> Pour une mise en production réelle avec des avis partagés entre tous les
> visiteurs, il faudra remplacer le stockage `localStorage` par une API/backend.

## Assistant Thélios (chatbot)

Un widget de chat flottant (bouton en bas à droite) permet aux visiteurs de
poser des questions en langage naturel sur les opticiens partenaires. Il
répond en interrogeant directement les données de `stores.json` (aucun appel
à un service externe ni clé d'API) :

- **Ville / code postal** : "Quels opticiens à Lyon ?", "Opticiens au 75011 ?"
- **Marques** : "Où trouver Dior ?"
- **Horaires** : "Horaires du magasin de Bordeaux ?"

La logique de correspondance se trouve dans `src/utils/chatbot.js` : elle
reconnaît les villes, codes postaux, marques et noms d'enseignes présents
dans `stores.json`, sans dépendance à un LLM. Pour brancher un vrai service
d'IA générative à la place, il suffit de remplacer l'appel à
`answerQuestion()` dans `src/components/ChatWidget.jsx` par un appel API.
