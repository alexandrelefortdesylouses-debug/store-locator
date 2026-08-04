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
- **Sidebar escamotable** (bouton `‹ / ›`) avec une recherche globale à
  autocomplétion (nom d'enseigne, ville ou code postal), des sélecteurs
  multiples pour région / département / ville (grandes villes françaises
  épinglées en haut de la liste) et des filtres par marque, plus un bouton
  **Réinitialiser les filtres** qui remet tout à zéro en un clic. Voir la
  section dédiée plus bas pour le détail de la recherche et des filtres
  multi-sélection.
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

**Corrections manuelles ponctuelles** appliquées directement sur `stores.json` (en plus de la régénération par script) :
- `door-0000710210` (Atol, 4 Centre Commercial de Toga, 20200) avait un champ `city` vide dans le fichier source Doors Master Data — le code postal 20200 correspondant à Bastia, la ville a été renseignée manuellement ("Bastia") et l'adresse complétée en conséquence.

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

## Recherche globale et filtres géographiques multi-sélection

- **Recherche à autocomplétion** (`src/components/SearchBar.jsx`) : la saisie
  filtre instantanément la liste/carte comme avant (ville, code postal,
  adresse), et cherche en plus dans le **nom de l'enseigne**. Dès 2
  caractères, un menu déroulant propose jusqu'à 7 suggestions (nom en gras +
  ville), classées par pertinence (nom qui commence par la saisie d'abord,
  puis ville) ; cliquer une suggestion — ou naviguer au clavier (`↑`/`↓`/
  `Entrée`, `Échap` pour fermer) — ouvre directement la fiche de l'opticien.
- **Filtres région / département / ville en sélection multiple**
  (`src/components/MultiSelect.jsx`, réutilisé par `RegionSelect.jsx`,
  `DepartmentSelect.jsx` et `CitySelect.jsx`) : chacun propose une liste à
  cases à cocher (avec recherche interne pour les départements et villes,
  listes longues) et affiche les valeurs choisies sous forme de puces
  cliquables (❌ pour retirer) — voir la section "Panneau de filtres en
  accordéon" ci-dessous pour la manière dont ces listes sont présentées dans
  la sidebar. Les trois filtres se combinent entre eux **et** avec la
  recherche, les marques et le type de boutique — la carte et la liste se
  mettent à jour à chaque changement (le filtrage est recalculé côté client
  via `useMemo` dans `App.jsx`, aucun round-trip serveur).
  - **Régions** : dérivées du code postal comme précédemment
    (`src/utils/regions.js`).
  - **Départements** : filtre (`src/utils/departments.js`), déduit du même
    code postal (préfixe à 2 chiffres, 3 pour l'outre-mer) et associé au nom
    officiel du département (ex. "06 – Alpes-Maritimes"). Comme un code
    postal ne permet pas de distinguer les deux départements corses, la Corse
    reste une entrée unique "20 – Corse", cohérente avec le filtre région.
  - **Villes** : la liste (`src/utils/frenchCities.js`) épingle en premier
    les grandes villes françaises (Paris, Marseille, Lyon, Toulouse, Nice,
    Nantes, Bordeaux, Lille, etc.) dans un groupe "Grandes villes", suivies
    de toutes les autres villes triées alphabétiquement.
- **Filtres géographiques en cascade** : Régions, Départements et Villes sont
  hiérarchiques — sélectionner une région limite la liste des départements
  proposés (et celle des villes) à cette région, et sélectionner un
  département limite en plus la liste des villes à ce département
  (`availableDepartments`/`availableCities` dans `App.jsx`, recalculés via
  `useMemo` à partir des régions/départements déjà sélectionnés — cette
  cascade est indépendante des autres filtres comme la recherche ou les
  marques). Si une région ou un département sélectionné exclut une valeur
  déjà cochée plus bas dans la hiérarchie (ex. désélectionner une région
  après avoir choisi une ville qui n'appartient plus à aucune région
  sélectionnée), cette sélection devenue incohérente est automatiquement
  retirée pour éviter un filtre "mort" qui ne pourrait plus jamais retourner
  de résultat.

## Panneau de filtres en accordéon

La sidebar a été restructurée en accordéon compact façon Nike
(`src/components/AccordionSection.jsx`) pour éviter un panneau interminable :

- Chaque catégorie, dans l'ordre **Régions → Départements → Villes → Type de
  boutique → Marques**, n'affiche par défaut que son **titre**, avec un badge
  indiquant le nombre de valeurs sélectionnées quand la section est repliée,
  et un chevron qui pivote à l'ouverture. Cliquer le titre déroule/replie la
  section (`aria-expanded` posé sur le bouton pour l'accessibilité) ;
  plusieurs sections peuvent rester ouvertes en même temps. Seule la section
  **Régions** est ouverte par défaut, les autres démarrent repliées — cet
  ordre correspond aussi à celui de la cascade ci-dessus (du plus large au
  plus précis).
  L'animation d'ouverture/fermeture repose sur la technique CSS Grid
  `grid-template-rows: 0fr → 1fr` (transition fluide sans mesurer la hauteur
  en JS) ; le contenu replié reste dans le DOM pour l'animation mais est
  rendu `inert` (non focusable, ignoré des lecteurs d'écran) tant que la
  section est fermée.
- Un petit texte d'aide discret ("Une question ? Notre assistant virtuel est
  disponible en bas à droite de votre écran.") est affiché en italique, gris
  clair, sous un filet séparateur, juste en dessous de la dernière catégorie
  de filtres (Marques) et avant la liste de résultats — pour rester visible
  sans attendre d'avoir fait défiler une éventuelle longue liste d'opticiens.
- **Correction du bug de défilement** signalé ("impossible d'atteindre le bas
  des filtres") : l'ancienne mise en page imbriquait deux zones de défilement
  (`overflow-y-auto` sur la sidebar entière **et** sur la liste de résultats
  à l'intérieur d'un conteneur `flex-1`/`overflow-hidden`), ce qui pouvait
  réduire la zone de résultats à une hauteur quasi nulle une fois tous les
  filtres affichés. La sidebar n'a maintenant plus qu'**une seule zone de
  défilement** (`min-h-0 flex-1 overflow-y-auto`, scrollbar fine via la
  classe `.thin-scrollbar` déjà utilisée ailleurs dans l'app) qui contient à
  la fois l'accordéon de filtres et la liste de résultats en dessous ; la
  recherche et le bouton "Réinitialiser les filtres" restent fixes en haut,
  hors de la zone de défilement.

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

## Habillage visuel "Thélios luxe"

La refonte esthétique passe par une **re-teinte globale de la palette
Tailwind** plutôt que par des retouches composant par composant : `src/index.css`
redéfinit certaines variables du thème Tailwind v4 (`@theme { --color-... }`),
ce qui met à jour instantanément toutes les classes `bg-neutral-*` /
`text-amber-*` déjà utilisées dans l'app, sans avoir à toucher chaque fichier.

- **Mode clair** : `neutral-50`/`neutral-100` (fonds de page et de cartes)
  passent d'un blanc/gris froid à un blanc cassé / beige champagne très
  discret (`#FAF8F4`, `#F4EFE6`) ; le reste de l'échelle neutre (bordures,
  textes secondaires) reste un gris sobre inchangé pour ne pas sacrifier la
  lisibilité.
- **Mode sombre** : `neutral-900`/`neutral-950` passent à un noir encre
  profond conforme à la spécification (`#0B0C0E` / `#131417` pour les
  surfaces légèrement surélevées comme les cartes et modales).
- **Accent doré** : la gamme `amber-*` (utilisée dans toute l'app pour les
  états actifs, bordures au survol, marques Thélios mises en avant…) est
  remplacée par un dégradé bronze/champagne plus feutré que l'orange-ambre
  par défaut de Tailwind, plus proche de l'univers de la haute lunetterie.
  Les couleurs codées en dur en dehors des classes Tailwind (marqueurs de
  carte, dégradé de la heatmap, barres du tableau de bord — non affectées par
  la redéfinition CSS) sont centralisées dans `src/utils/palette.js` pour
  rester alignées avec cette même teinte.
- **Ombres adoucies** : `shadow-md/lg/xl/2xl` sont redéfinies avec une
  diffusion plus large et une opacité plus faible pour un rendu "flottant"
  plus feutré que les ombres par défaut de Tailwind, sur toute l'app
  (panneaux, modales, cartes de résultats).
- Aucune police externe n'a été ajoutée (pour éviter une dépendance réseau à
  un CDN de polices) : l'effet "épuré et raffiné" s'appuie sur la police
  serif système déjà utilisée pour les titres, combinée aux nouveaux
  espacements/couleurs.

## Carte Globale vs Ma Carte

Un sélecteur en haut de l'interface (`src/components/ViewModeToggle.jsx`)
bascule entre deux vues :

- **Carte Globale** : le comportement historique de l'app, l'intégralité du
  réseau d'opticiens partenaires.
- **Ma Carte** : un espace personnel qui n'affiche que les opticiens du
  portefeuille importé et/ou marqués en favori. Tous les filtres existants
  (recherche, région/département/ville, marque, type de boutique) restent
  utilisables pour affiner à l'intérieur de cet ensemble personnel — leurs
  listes d'options se recalculent d'ailleurs automatiquement pour ne
  proposer que les valeurs présentes dans "Ma Carte" (`baseUniverse` dans
  `App.jsx`). L'optimisation de trajet fonctionne sans changement puisqu'elle
  s'applique déjà à n'importe quelle sélection de magasins, quelle que soit
  la vue active.

> ⚠️ **"Ma Carte" n'est pas un vrai système de comptes multi-utilisateurs.**
> L'app n'a pas de backend : comme le code secret des avis, tout est stocké
> dans le `localStorage` de cet appareil/navigateur. "Ma Carte" désigne donc
> l'utilisateur de CET appareil, pas un compte synchronisé entre plusieurs
> postes. Un vrai système de comptes (avec authentification et données
> partagées entre appareils) nécessiterait un backend — c'est le point déjà
> noté plus bas comme non traité dans cette itération.

### Favoris et notes privées

- **Favoris** (`src/utils/myCard.js`, `src/components/FavoriteButton.jsx`) :
  un bouton cœur sur chaque fiche opticien (liste et panneau détaillé),
  disponible dans les deux vues — c'est en favorisant un opticien depuis la
  Carte Globale qu'il rejoint "Ma Carte".
- **Notes privées** (`src/components/StoreNotes.jsx`) : un champ de texte
  libre dans la fiche détaillée de chaque opticien (ex. "Prochain RDV le
  12/10, relancer pour la collection Vuarnet"), enregistré au fil de la
  saisie dans le `localStorage`, par opticien.

### Import de portefeuille (.xlsx / .csv)

Dans "Ma Carte", le bouton **Importer mon portefeuille clients** accepte un
fichier `.xlsx` ou `.csv` et tente de rapprocher chaque ligne avec la base
`stores.json` :

1. **Lecture du fichier** (`src/utils/fileParsing.js`) : les `.xlsx` sont lus
   avec `read-excel-file` (bibliothèque du même auteur que `write-excel-file`,
   déjà utilisée pour l'export) plutôt qu'avec le paquet `xlsx` de SheetJS —
   ce dernier a une vulnérabilité connue (pollution de prototype / ReDoS)
   sans correctif publié sur npm, inacceptable pour une bibliothèque qui
   parse des fichiers déposés par l'utilisateur. Les `.csv` sont lus avec un
   analyseur maison (gestion des champs entre guillemets, des guillemets
   échappés, du BOM UTF-8, et détection automatique du séparateur `,` ou `;`
   — les exports Excel français utilisent souvent `;` puisque `,` sert de
   séparateur décimal).
2. **Détection des colonnes** (`src/utils/portfolioMatching.js`) : repère les
   colonnes Nom / Ville / Code Postal quel que soit l'intitulé exact (FR/EN,
   variantes usuelles). Une colonne SIRET est détectée mais **jamais
   utilisée pour le rapprochement** : ce champ n'existe pas dans
   `stores.json`.
3. **Rapprochement (matching)**, par ordre de précision décroissante : nom +
   code postal exacts → nom + ville exacts → nom unique dans toute la base →
   en dernier recours, un nom partiellement inclus dans le nom d'un magasin
   de la même ville (utile pour les raisons sociales tronquées). C'est une
   heuristique de bonne foi, pas un identifiant garanti — les enseignes en
   franchise (Krys, Optic 2000…) qui apparaissent des centaines de fois dans
   la base ne peuvent être désambiguïsées que par la ville ou le code
   postal.
4. Les lignes reconnues sont ajoutées au portefeuille (fusionnées avec
   l'existant, pas de doublons) ; une fenêtre de résumé indique le nombre de
   lignes identifiées (ex. "45/48 opticiens identifiés et ajoutés à votre
   carte") et liste les lignes non reconnues pour vérification manuelle.

Le bouton **Réinitialiser le portefeuille importé** vide uniquement les
opticiens issus de l'import (les favoris ajoutés manuellement ne sont pas
concernés) ; réimporter un fichier après reprend simplement le processus.

La bibliothèque d'import est chargée par un `import()` dynamique déclenché
uniquement au moment de l'import d'un `.xlsx`, pour ne pas alourdir le
chargement initial de l'app pour les visiteurs qui n'utilisent jamais cette
fonctionnalité (elle apparaît comme un fichier séparé dans le build, voir
`npm run build`).

## Prochaine étape (non traitée dans cette itération)

Le point "page d'accueil + système de compte (favoris, avis personnalisés,
historique)" a été explicitement mis de côté pour une itération future, le
temps de décider de l'architecture (compte local au navigateur vs backend
réel type Supabase/Firebase).
