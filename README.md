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
  arrondis, ombre légère) plutôt qu'en arrière-plan plein écran, centrée par
  défaut sur la France.
- **Sidebar escamotable** (bouton `‹ / ›`) avec recherche libre (ville/code
  postal), un sélecteur de région, un sélecteur de ville (grandes villes
  françaises épinglées en haut de la liste) et des filtres par marque, plus un
  bouton **Réinitialiser les filtres** qui remet tout à zéro en un clic.
- **Aucune liste par défaut** : les opticiens ne s'affichent (dans la sidebar
  et sur la carte) qu'une fois une recherche, une région, une ville ou une
  marque sélectionnée — ou en cliquant sur **Mode libre** pour afficher
  l'ensemble des opticiens sans filtre.
- **Fiche opticien** : un panneau détaillé s'ouvre au clic sur un opticien (dans
  la liste ou sur la carte), avec ville/pays, marques distribuées, horaires,
  bouton d'itinéraire (Google Maps) et la section avis clients.
- **Marques mises en avant** : dans le filtre par marque, une section
  "Marques Thélios" distingue Barton Perreira et Vuarnet du reste des marques.
  Sur la carte, les opticiens qui distribuent l'une de ces deux marques
  affichent un marqueur doré, les autres un marqueur gris/anthracite (une
  légende en bas à gauche de la carte rappelle ce code couleur).
- **Bilingue FR / EN** : sélecteur de langue dans l'en-tête qui bascule toute
  l'interface (filtres, fiches, chatbot, messages d'erreur) en anglais. Les
  données des opticiens (noms, adresses, marques) restent inchangées — seule
  l'interface est traduite. Voir la section dédiée plus bas.
- **Logo officiel** en en-tête (`public/logo-thelios.jpg`), sur un socle clair
  arrondi pour rester lisible malgré son fond crème opaque sur l'en-tête sombre.
- **Géolocalisation "Autour de moi"** : bouton cible en haut à droite de la
  carte qui centre la vue sur la position du visiteur et affiche les 30
  opticiens les plus proches, triés par distance (badge "X km" sur chaque
  fiche). Se combine avec les autres filtres (ville, marque…) si activés.
- **Statistiques réseau** : bouton dans l'en-tête ouvrant un tableau de bord
  (chiffres clés + graphiques de répartition Thélios vs concurrents par
  région et par ville).
- **Export Excel** : bouton "Exporter la sélection" dans la sidebar, qui
  télécharge un vrai fichier `.xlsx` mis en forme (voir plus bas) listant les
  opticiens actuellement filtrés/affichés (adresse, code postal, téléphone,
  email, marques, horaires si disponibles, coordonnées GPS).

## Données des opticiens

Les opticiens affichés sont définis dans `public/stores.json` — **5 542
opticiens partenaires en France au total**, tous issus des données réelles du
client (aucune donnée fictive), répartis sur 15 marques : les 13 marques du
premier lot (Julbo, Maui Jim, Serengeti, Chanel, Cartier, Moscot, Mykita,
Thierry Lasry, Lindberg, Dita, JMM, Thom Browne, Oakley — Porsche Design n'a
aucune entrée française) plus Barton Perreira et Vuarnet (voir plus bas).

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
dans `src/utils/brands.js` (`FEATURED_BRANDS`) et alimentées séparément par
`scripts/build_featured_brands_from_doors.py`, à partir du fichier client
`TH5584C Doors Master data (75).xlsx` (export "Doors Master Data" de Thélios) :

1. Filtrage des lignes `Country Name = France` **et** contrat actif
   (`Date To` = année 9999, la valeur sentinelle du fichier pour "sans date de
   fin" — les contrats expirant réellement en 2024/2025/2026 sont exclus).
2. Regroupement par `Door Code` (identifiant unique du point de vente) pour
   fusionner les opticiens qui distribuent les deux marques en une seule fiche.
3. Géocodage à l'adresse complète (rue + code postal + ville) via l'API
   Adresse du gouvernement français — précision bien supérieure au
   géocodage par ville utilisé pour le premier lot de marques.

Résultat : **1 077 opticiens Vuarnet/Barton Perreira** ajoutés à
`stores.json` (fusionnés avec les 4 465 existants, sans tentative de
dédoublonnage entre les deux fichiers sources), avec adresse précise,
téléphone et email quand disponibles. Pour régénérer :

```bash
python3 scripts/build_featured_brands_from_doors.py
```

## Regroupement des marqueurs (clustering)

Avec plusieurs milliers d'opticiens, la carte utilise `react-leaflet-cluster`
pour regrouper les marqueurs proches en bulles numérotées, qui se dissocient
au fur et à mesure du zoom. Cela garde la carte lisible et performante même
lorsqu'un filtre par marque affiche plus d'un millier de résultats.

## Filtre par région et tri des villes

Le champ `region` n'existe pas dans `stores.json` : il est déduit à la volée
côté client (`src/utils/regions.js`) à partir du code postal contenu dans le
champ `address` de chaque opticien, via la table officielle de correspondance
département → région (13 régions métropolitaines + DOM). Les opticiens dont
l'adresse ne contient pas de code postal exploitable (rares, cf. limites plus
haut) n'apparaissent simplement dans aucun filtre région.

La liste déroulante des villes (`src/utils/frenchCities.js`) épingle en premier
les grandes villes françaises (Paris, Marseille, Lyon, Toulouse, Nice, Nantes,
Bordeaux, Lille, etc.) dans un groupe "Grandes villes", suivies de toutes les
autres villes triées alphabétiquement dans un second groupe.

## Langue (FR / EN)

Le sélecteur `FR / EN` dans l'en-tête bascule toute l'interface. La logique se
trouve dans `src/i18n/` :

- `translations.js` : dictionnaire plat `{ fr: {...}, en: {...} }`.
- `LanguageContext.jsx` : fournit `useLanguage()` (`{ lang, setLang, t }`),
  persiste le choix dans le `localStorage` de l'appareil.

Le chatbot (`src/utils/chatbot.js`) répond aussi dans la langue active
(templates de réponse séparés par langue), sans dépendre d'un service de
traduction externe. Pour ajouter une langue, dupliquer un bloc dans
`translations.js` et l'ajouter au sélecteur dans `Header.jsx`.

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
d'enseignes présents dans `stores.json`, sans dépendance à un LLM. Les
correspondances de nom de magasin utilisent une limite de mots (regex
`\b...\b`) pour éviter qu'un nom générique/court ne matche par erreur à
l'intérieur d'un autre mot, et n'identifie un magasin par son nom que si ce
nom est unique dans les données (ou peut être précisé par une ville
mentionnée dans la question) — utile vu le nombre d'enseignes en franchise
(Krys, Optic 2000, etc.) qui apparaissent des centaines de fois. Pour
brancher un vrai service d'IA générative à la place, il suffit de remplacer
l'appel à `answerQuestion()` dans `src/components/ChatWidget.jsx` par un
appel API.

## Géolocalisation

`src/utils/geo.js` calcule la distance à vol d'oiseau (formule de haversine)
entre la position du visiteur (`navigator.geolocation`) et chaque opticien.
Cliquer sur le bouton cible (`src/components/LocateMeButton.jsx`) :

1. Demande la position au navigateur (gère les cas non supporté / refusé,
   message d'erreur affiché à côté du bouton).
2. Centre la carte sur cette position (zoom ~12) et affiche un marqueur bleu
   pulsant "vous êtes ici".
3. Sans autre filtre actif, limite la liste aux 30 opticiens les plus proches
   triés par distance ; combiné à un filtre (ville, marque…), trie simplement
   les résultats déjà filtrés par distance croissante.

La distance étant calculée à partir des coordonnées de `stores.json` (précises
au niveau ville pour le premier lot de marques, voir plus haut), elle reste
approximative pour ces opticiens.

## Statistiques réseau

Le bouton **Statistiques** de l'en-tête ouvre `src/components/Dashboard.jsx`,
qui calcule (`src/utils/stats.js`) et affiche :

- des chiffres clés (nombre total d'opticiens, taux de pénétration des
  marques Thélios, nombre d'opticiens Thélios vs concurrents uniquement) ;
- deux graphiques en barres horizontales (`src/components/BreakdownBarChart.jsx`)
  comparant opticiens Thélios / concurrents par région et pour le top 10 des
  villes.

Le code doré (`#b45309`) et gris anthracite (`#57534e`) reprend celui des
marqueurs de la carte pour rester cohérent visuellement dans toute l'app.

## Export Excel

Le bouton **Exporter la sélection** (visible dans la sidebar dès qu'une liste
d'opticiens est affichée) télécharge un fichier `.xlsx` (`src/utils/xlsxExport.js`,
librairie `write-excel-file`) contenant exactement les opticiens actuellement
filtrés/affichés — donc aussi bien un export ciblé (ex. "Julbo en Bretagne")
que l'intégralité du réseau en mode libre. Mise en forme appliquée :

- En-tête fond bleu marine (`#0F172A`), texte blanc gras, centré horizontalement
  et verticalement, ligne de 22 points de haut (~28-29 px).
- Largeur de chaque colonne calculée automatiquement à partir du contenu le
  plus long (aucun texte tronqué).
- Alignement à gauche pour les champs texte (nom, adresse, ville, pays, email,
  marques, horaires), centré pour le code postal, le téléphone et les
  coordonnées GPS.
- Bordures fines gris clair (`#E2E8F0`) sur toutes les cellules, effet zébré
  (`#F8FAFC` une ligne sur deux) pour la lisibilité, ligne d'en-tête figée
  (`stickyRowsCount`).
- **Code postal extrait dans sa propre colonne** (regex sur l'adresse) et
  formaté explicitement en texte (`format: '@'`) : les zéros initiaux sont
  conservés (`06400`, pas `6400`), y compris pour la colonne téléphone.

## Mobile & responsive

L'interface s'adapte du smartphone au grand écran :

- En dessous du seuil `md` (768px), un bandeau d'onglets **Carte / Liste**
  (`src/components/MobileTabs.jsx`) remplace la mise en page côte-à-côte du
  desktop : un seul des deux panneaux (sidebar/liste ou carte) est affiché à
  la fois, l'autre restant monté mais masqué (`hidden`/`block`) pour
  conserver son état (filtres, position de la carte…) au changement d'onglet.
  Ce choix — bascule par onglets plutôt qu'un tiroir à glissement (bottom
  sheet) — a été retenu pour rester simple et fiable au clavier/tactile.
- Boutons, cartes d'opticiens, puces de filtre et champs de formulaire ont
  une zone de clic élargie (`h-8`+ / `py-2`+) pour rester confortables au
  doigt.
- Au-delà de `md`, la mise en page desktop (sidebar + carte côte à côte)
  reste inchangée.

## Mode Heatmap et filtre par type de point de vente

- **Heatmap** (`src/components/HeatmapToggle.jsx`, bascule en haut à droite
  de la carte) : remplace les marqueurs par une carte de chaleur
  (`leaflet.heat`) illustrant les zones de forte concentration d'opticiens
  parmi les résultats actuellement filtrés.
- **Type de point de vente** (`src/components/StoreTypeFilter.jsx`,
  `src/utils/storeType.js`) : filtre les opticiens par "Boutique Flagship",
  "Opticien Indépendant" ou "Grand Magasin".
  > ⚠️ **Ce champ n'existe pas dans les données source.** Il s'agit d'une
  > classification heuristique calculée côté client à partir du nom de
  > l'enseigne (ex. présence de "flagship", ou noms d'enseignes de grands
  > magasins comme Galeries Lafayette, Printemps, BHV, Fnac…) et du nombre de
  > marques distribuées. À affiner ou remplacer dès qu'un champ de
  > typologie réel sera fourni par le client.

## Optimisation de trajet

Sur chaque fiche opticien (liste ou panneau détaillé), une case à cocher
permet de sélectionner jusqu'à 4 opticiens (`MAX_ROUTE_STOPS` dans
`src/utils/route.js`). Le panneau flottant `src/components/RoutePlanner.jsx`
(bas de la carte) permet ensuite de :

1. **Optimiser mon trajet** : calcule par force brute (24 permutations max
   pour 4 arrêts) l'ordre qui minimise la distance totale à vol d'oiseau
   (`optimizeRouteOrder`), en partant de la position géolocalisée du
   visiteur si elle est disponible.
2. **Ouvrir dans Google Maps** : lien d'itinéraire multi-étapes
   (`origin`/`waypoints`/`destination`).
3. **Ouvrir dans Waze** : Waze ne supportant pas les itinéraires
   multi-étapes via lien, ce bouton pointe uniquement vers le premier arrêt
   de l'itinéraire optimisé.

Les arrêts sélectionnés s'affichent sur la carte avec des marqueurs numérotés
et un tracé en pointillés (numérotés par ordre de sélection avant
optimisation, puis par ordre optimisé une fois calculé).

## Mode sombre

Bascule soleil/lune dans l'en-tête (`src/components/DarkModeToggle.jsx`),
pilotée par `src/theme/ThemeContext.jsx` :

- Préférence persistée dans le `localStorage` (`storeLocator_theme`), avec
  repli sur `prefers-color-scheme` du système si rien n'est enregistré.
- Un script inline dans `index.html` applique la classe `dark` sur `<html>`
  avant le premier rendu React, pour éviter un flash de thème clair au
  chargement.
- Tous les composants (sidebar, fiches, formulaires, chatbot, dashboard,
  export…) ont leurs variantes `dark:` Tailwind. Le fond de carte bascule
  vers un fond sombre (tuiles CartoDB "dark_all") et les popups/contrôles de
  zoom Leaflet sont restylés en sombre (`src/index.css`).

## Prochaine étape (non traitée dans cette itération)

Le point "page d'accueil + système de compte (favoris, avis personnalisés,
historique)" a été explicitement mis de côté pour une itération future, le
temps de décider de l'architecture (compte local au navigateur vs backend
réel type Supabase/Firebase).
