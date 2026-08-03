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
- **Marques mises en avant** : dans le filtre par marque, une section
  "Nos marques" distingue Barton Perreira et Vuarnet du reste des marques.
  Sur la carte, les opticiens qui distribuent l'une de ces deux marques
  affichent un marqueur doré, les autres un marqueur gris/anthracite (une
  légende en bas à gauche de la carte rappelle ce code couleur).

## Données des opticiens

Les opticiens affichés sont définis dans `public/stores.json`. Ce fichier est
désormais généré à partir de la base réelle du client (fichier Excel
`SCRAPPING_DATABASE_SEPT 2025_...xlsx`, 14 marques, ~39 500 lignes), filtrée
sur la France : **4 465 opticiens partenaires** répartis sur 13 marques
(Julbo, Maui Jim, Serengeti, Chanel, Cartier, Moscot, Mykita, Thierry Lasry,
Lindberg, Dita, JMM, Thom Browne, Oakley — Porsche Design n'a aucune entrée
française dans la base).

Le script `scripts/build_stores_from_excel.py` effectue ce traitement :

1. Lecture des 14 onglets du fichier Excel et filtrage des lignes `Country = France`.
2. Fusion des opticiens présents sur plusieurs onglets (même enseigne, marques différentes) en une seule fiche avec un tableau `brands` combiné.
3. Géocodage de chaque ville via l'API officielle Adresse du gouvernement français (`api-adresse.data.gouv.fr`, gratuite, sans clé) — **précision au niveau de la ville**, pas de l'adresse exacte (choix validé pour ce lot : l'Excel ne fournit pas de latitude/longitude sauf pour la marque JMM).

Pour régénérer `stores.json` après une mise à jour de l'Excel :

```bash
pip install openpyxl
python3 scripts/build_stores_from_excel.py
```

**Limites connues** de cette conversion, héritées de la qualité des données sources :
- Quelques dizaines d'entrées (~55 sur 4 465) ont été écartées faute de géocodage fiable (villes mal renseignées dans l'Excel, ex. des adresses portugaises/suisses marquées par erreur "France", ou des noms de villes tronqués/mal orthographiés).
- Les horaires d'ouverture ne sont pas fournis par l'Excel : le champ `hours` est donc absent pour ces opticiens (la fiche détaillée masque simplement cette section).
- La géolocalisation étant au niveau ville, plusieurs opticiens d'une même ville partagent exactement les mêmes coordonnées — la carte les regroupe visuellement via un système de clusters (voir plus bas).

Structure d'une entrée :

```json
{
  "id": "identifiant-unique",
  "name": "Nom de l'opticien",
  "address": "Adresse complète",
  "city": "Ville",
  "country": "Pays",
  "lat": 48.8532,
  "lng": 2.3708,
  "brands": ["Julbo", "Maui Jim"],
  "phone": "Optionnel",
  "email": "Optionnel",
  "website": "Optionnel"
}
```

Le filtre par marque et le sélecteur de ville de la sidebar sont générés
automatiquement à partir des valeurs `brands` et `city` présentes dans ce
fichier. Chaque opticien doit avoir un tableau `brands` non vide : c'est ce
champ qui alimente à la fois les filtres, le code couleur des marqueurs et les
réponses du chatbot.

Les deux marques mises en avant (Barton Perreira et Vuarnet) sont définies
dans `src/utils/brands.js` (`FEATURED_BRANDS`). Elles n'apparaissent pas
encore dans le jeu de données actuel (en attente de vos données spécifiques) :
tous les marqueurs sont donc actuellement gris/anthracite jusqu'à leur ajout.

## Regroupement des marqueurs (clustering)

Avec plusieurs milliers d'opticiens, la carte utilise `react-leaflet-cluster`
pour regrouper les marqueurs proches en bulles numérotées, qui se dissocient
au fur et à mesure du zoom. Cela garde la carte lisible et performante même
lorsqu'un filtre par marque affiche plus d'un millier de résultats.

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
- **Marques** : "Où trouver Julbo ?"
- **Horaires** : "Horaires du magasin de Nice ?" (répond que l'information n'est pas disponible si absente des données)

La logique de correspondance se trouve dans `src/utils/chatbot.js` : elle
reconnaît les villes (champ `city`), codes postaux, marques et noms
d'enseignes présents dans `stores.json`, sans dépendance à un LLM. Pour
brancher un vrai service d'IA générative à la place, il suffit de remplacer
l'appel à `answerQuestion()` dans `src/components/ChatWidget.jsx` par un
appel API.
