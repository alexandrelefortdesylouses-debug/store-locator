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

- **Carte interactive** intégrée dans un conteneur encadré (marges, coins
  arrondis, ombre légère) plutôt qu'en arrière-plan plein écran.
- **Sidebar escamotable** (bouton `‹ / ›`) avec recherche libre (ville/code
  postal), un sélecteur de ville dédié et des filtres par marque.
- **Aucune liste par défaut** : les opticiens ne s'affichent (dans la sidebar
  et sur la carte) qu'une fois une recherche, une ville ou une marque
  sélectionnée. Un message d'accueil invite à utiliser les filtres.
- **Fiche opticien** : un panneau détaillé s'ouvre au clic sur un opticien (dans
  la liste ou sur la carte), avec ville/pays, marques distribuées, horaires,
  bouton d'itinéraire (Google Maps) et la section avis clients.

## Données des opticiens

Les opticiens affichés sont définis dans `public/stores.json`. Le fichier
fourni contient une vingtaine d'opticiens fictifs répartis dans le monde
(Paris, Lyon, New York, Tokyo, Milan, Londres, Madrid, Dubaï, Genève, Hong
Kong, Los Angeles, etc.), à titre de démonstration. Pour utiliser vos propres
données, remplacez ce fichier en conservant la même structure :

```json
{
  "id": "identifiant-unique",
  "name": "Nom de l'opticien",
  "address": "Adresse complète",
  "city": "Ville",
  "country": "Pays",
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

Le filtre par marque et le sélecteur de ville de la sidebar sont générés
automatiquement à partir des valeurs `brands` et `city` présentes dans ce
fichier : il suffit d'ajouter/retirer des entrées dans `stores.json` pour que
les filtres se mettent à jour.

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

- **Ville / code postal** : "Quels opticiens à Tokyo ?", "Opticiens au 75011 ?"
- **Marques** : "Où trouver Dior ?"
- **Horaires** : "Horaires du magasin de Londres ?"

La logique de correspondance se trouve dans `src/utils/chatbot.js` : elle
reconnaît les villes (champ `city`), codes postaux, marques et noms
d'enseignes présents dans `stores.json`, sans dépendance à un LLM. Pour
brancher un vrai service d'IA générative à la place, il suffit de remplacer
l'appel à `answerQuestion()` dans `src/components/ChatWidget.jsx` par un
appel API.
