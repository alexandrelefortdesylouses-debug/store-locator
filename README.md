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

- **Écran de connexion** : l'app est protégée par une whitelist d'e-mails
  (accès autorisé ou bloqué selon l'adresse saisie) et un rôle Admin /
  Commercial par utilisateur — voir "Connexion, rôles & Administration"
  plus bas pour le détail et l'avertissement sur son caractère local.
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
- **Bilingue FR / EN** : sélecteur de langue dans Paramètres > Préférences
  qui bascule toute l'interface (filtres, fiches, chatbot, messages
  d'erreur) en anglais. Les données des opticiens (noms, adresses,
  marques) restent inchangées — seule
  l'interface est traduite. Voir la section dédiée plus bas.
- **Logo officiel** en en-tête (`public/logo-thelios.jpg`), sur un socle clair
  arrondi pour rester lisible malgré son fond crème opaque sur l'en-tête sombre.
  Le fichier est recadré au plus près du bloc-marque (wordmark + signature
  "LVMH Eyewear Excellence") — la version fournie par le client avait une
  large marge crème inutilisée autour du texte, ce qui produisait un socle
  démesuré et mal proportionné dans l'en-tête ; le recadrage ne change rien
  au design du logo lui-même.
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

Les opticiens affichés sont définis dans `public/stores.json` — **5 583
opticiens partenaires en France au total**, tous issus des données réelles du
client (aucune donnée fictive), répartis sur 15 marques : les 13 marques du
premier lot (Julbo, Maui Jim, Serengeti, Chanel, Cartier, Moscot, Mykita,
Thierry Lasry, Lindberg, Dita, JMM, Thom Browne, Oakley — Porsche Design n'a
aucune entrée française) plus Barton Perreira et Vuarnet (voir plus bas).

Le script `scripts/build_stores_from_excel.py` effectue ce traitement :

1. Lecture des 14 onglets du fichier Excel et filtrage des lignes `Country = France`.
2. Fusion des opticiens présents sur plusieurs onglets (même enseigne, marques différentes) en une seule fiche avec un tableau `brands` combiné.
3. Géocodage à l'**adresse complète** (rue + code postal + ville, telle que
   fournie dans le champ `Address` de l'Excel) via l'API officielle Adresse
   du gouvernement français (`api-adresse.data.gouv.fr`, la Base Adresse
   Nationale — gratuite, sans clé, et **exclusivement française** par
   construction : elle ne peut par nature jamais renvoyer une adresse d'un
   autre pays, donc aucun paramètre "pays" à ajouter). Si la requête sur
   l'adresse complète échoue, elle retombe sur le nom de la ville seul.
4. **Validation croisée par département** : la réponse de l'API inclut son
   propre code postal ; s'il ne correspond pas au département attendu
   d'après le code postal déjà présent dans l'adresse source, le résultat
   est rejeté (et la requête retombe sur la ville seule) plutôt qu'accepté
   tel quel — utile car une adresse chargée de texte parasite (nom
   d'enseigne, de centre commercial) peut occasionnellement faire
   correspondre la recherche floue à un lieu sans rapport ailleurs en
   France.

> ⚠️ **Ce script géocodait auparavant par nom de ville seul** (sans rue ni
> code postal), ce qui produisait deux problèmes : tous les opticiens d'une
> même ville partageaient un point identique (imprécis), et surtout, les
> quelques communes françaises homonymes (ex. "Saint Louis" dans le
> Haut-Rhin vs à La Réunion, "Montreuil" en Seine-Saint-Denis vs à
> Montreuil-sur-Mer, "Les Angles" dans le Gard vs dans les
> Pyrénées-Orientales) pouvaient être géocodées sur les coordonnées du
> mauvais homonyme, à des milliers de km de leur adresse réelle — alors même
> que leur code postal en base était correct. Le passage à l'adresse
> complète (+ la validation croisée par département ci-dessus) corrige ces
> cas ; `public/stores.json` a été intégralement régénéré avec la version
> corrigée du script.

Pour régénérer `stores.json` après une mise à jour de l'Excel :

```bash
pip install openpyxl
python3 scripts/build_stores_from_excel.py
```

**Limites connues** de cette conversion, héritées de la qualité des données sources :
- Quelques dizaines d'entrées (14 sur 4 520) ont été écartées faute de géocodage fiable (villes mal renseignées dans l'Excel, ex. des adresses portugaises/suisses marquées par erreur "France", ou des noms de villes tronqués/mal orthographiés).
- Les horaires d'ouverture ne sont pas fournis par l'Excel : le champ `hours` est donc absent pour ces opticiens (la fiche détaillée masque simplement cette section).
- Une entrée (opticien "Saint Francois", ville de Guadeloupe) porte un code
  postal manifestement mal saisi dans l'Excel source (`07118`, un préfixe de
  l'Ardèche, au lieu de `97118`) ; la validation croisée ne peut pas
  détecter une erreur dans la donnée source elle-même, seulement une
  incohérence entre la donnée source et le résultat du géocodage — cette
  entrée est donc géocodée sur un résultat peu fiable, mais
  `src/utils/geoSanity.js` le détecte à l'usage et masque simplement son
  marqueur sur la carte plutôt que d'afficher un point erroné (voir plus
  haut).

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
   Adresse du gouvernement français, avec la même validation croisée par
   département que `build_stores_from_excel.py` ci-dessus (ce script a
   toujours géocodé à l'adresse complète, contrairement à l'autre avant sa
   correction — seule la validation croisée est une addition récente).

Résultat : **1 077 opticiens Vuarnet/Barton Perreira** ajoutés à
`stores.json` (fusionnés avec les 4 506 existants, sans tentative de
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

Le contrôle d'attribution Leaflet ("Leaflet | © OpenStreetMap…" en bas à
droite) est désactivé (`attributionControl={false}` sur `MapContainer`,
`src/components/MapView.jsx`) à la demande du produit.

> ⚠️ Les conditions d'utilisation des fonds de carte OpenStreetMap et CARTO
> (utilisés respectivement en mode clair et sombre) exigent normalement de
> créditer leur source quelque part sur toute page qui les affiche —
> désactiver le contrôle sur la carte elle-même ne supprime pas cette
> obligation, il faudrait la satisfaire autrement (ex. un crédit en pied de
> page) pour rester en conformité avec leurs licences.

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
    (`src/utils/regions.js`) — une appartenance stricte code postal → département
    → région (table de correspondance figée, pas une recherche par mot-clé
    dans l'adresse). Les codes postaux `971`–`976` sont associés
    exclusivement à leur région DOM-TOM respective (Guadeloupe, Martinique,
    Guyane, La Réunion, Saint-Pierre-et-Miquelon, Mayotte), jamais mélangés à
    une région métropolitaine.
  - **Géocodage** (génération de `stores.json`, voir la section dédiée
    plus bas) : les coordonnées viennent d'un script Python
    (`scripts/build_stores_from_excel.py`) qui interroge l'adresse
    complète (rue + code postal + ville) sur la Base Adresse Nationale du
    gouvernement français, pas seulement le nom de la ville — un ancien
    défaut qui provoquait de véritables erreurs de géocodage (une poignée
    de communes françaises homonymes, ex. "Saint Louis" dans le Haut-Rhin
    vs à La Réunion, "Montreuil" en Seine-Saint-Denis vs à
    Montreuil-sur-Mer, "Les Angles" dans le Gard vs dans les
    Pyrénées-Orientales, se retrouvaient géocodées sur les coordonnées du
    mauvais homonyme, à des milliers de km de leur adresse réelle — leur
    code postal en base était pourtant correct, donc le filtre région/
    département n'était lui-même jamais affecté). `src/utils/geoSanity.js`
    reste en place comme filet de sécurité applicatif : il détecte toute
    incohérence résiduelle entre les coordonnées d'un opticien et le
    territoire impliqué par son propre code postal (utile si une nouvelle
    erreur de saisie apparaît dans un futur import) et exclut uniquement le
    **marqueur sur la carte** du ou des opticiens concernés (liste, filtres,
    exports restent inchangés puisque leurs données textuelles sont
    fiables) — voir `MapView.jsx`.
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
- **Correction du bouton de repli/dépli** (`‹ / ›`) qui apparaissait à moitié
  coupé sur le bord de la sidebar : la cause était que ce bouton, positionné
  en négatif (`-right-3`) pour "flotter" à cheval sur la bordure, était un
  enfant du `<aside>` — qui a lui-même besoin de `overflow-hidden` pour
  masquer proprement son contenu pendant l'animation de largeur repliée/
  dépliée. Son propre parent le rognait donc. Le bouton est maintenant un
  frère du `<aside>` (dans un conteneur englobant sans `overflow-hidden`,
  qui porte la largeur/transition), avec un `z-index` plus élevé (`z-30`) et
  une taille de cible tactile augmentée (`h-8 w-8` contre `h-7 w-7`) — il
  s'affiche donc désormais intégralement, quel que soit l'état replié/
  déplié.

## Langue (FR / EN)

Le sélecteur `FR / EN` dans **Paramètres > Préférences** (voir "Rubrique
Paramètres" plus bas) bascule toute l'interface — il n'y a plus de
sélecteur dupliqué dans l'en-tête, pour l'alléger. La logique se trouve
dans `src/i18n/` :

- `translations.js` : dictionnaire plat `{ fr: {...}, en: {...} }`.
- `LanguageContext.jsx` : fournit `useLanguage()` (`{ lang, setLang, t }`),
  persiste le choix dans le `localStorage` de l'appareil.

Le chatbot (`src/utils/chatbot.js`) répond aussi dans la langue active
(templates de réponse séparés par langue), sans dépendre d'un service de
traduction externe. Pour ajouter une langue, dupliquer un bloc dans
`translations.js` et l'ajouter au sélecteur dans `SettingsPanel.jsx`.

## Avis clients et code secret

Chaque fiche opticien affiche une section d'avis clients. Le formulaire
d'ajout d'avis est protégé par un code secret (par défaut : `1234`).

- Les avis sont enregistrés dans le `localStorage` du navigateur (par magasin).
- Le code secret peut être modifié à tout moment via le bouton
  **Paramètres** en haut de la page, onglet **Préférences** (il faut
  connaître le code actuel pour le changer) — voir la section "Rubrique
  Paramètres" plus bas pour le reste de ce qu'on y trouve.
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

Ce périmètre est volontairement rendu visible dans l'interface plutôt que
laissé implicite : le message d'accueil du chat détaille les 3 sujets pris
en charge avec un exemple de question pour chacun, et un bandeau permanent
sous l'en-tête du widget ("Je réponds aux questions sur : ville/code postal
· marques · horaires") le rappelle même une fois la conversation entamée
(`src/components/ChatWidget.jsx`).

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
qui calcule (`src/utils/stats.js`) et affiche des chiffres clés (nombre total
d'opticiens, taux de pénétration des marques Thélios, opticiens Thélios vs
concurrents uniquement), toujours visibles en haut du tableau de bord.

- **Portée dynamique** : le tableau de bord ne recalcule plus systématiquement
  sur l'ensemble du réseau — il reflète la sélection courante (recherche,
  filtres région/département/ville/marque/type, ou le contenu de "Ma Carte")
  exactement comme la carte et la liste au moment où on l'ouvre. Sans aucun
  filtre actif, il retombe sur l'ensemble du réseau plutôt que d'afficher un
  tableau vide. Un petit texte italique sous le titre indique laquelle des
  deux portées est utilisée (ex. "Basé sur la sélection actuelle (247
  opticiens)").
- **Sélecteur d'indicateur** : un menu déroulant permet de choisir la vue
  affichée, parmi :
  - **Couverture par Région/Département** — deux graphiques en barres
    (`src/components/BreakdownBarChart.jsx`) opposant opticiens Thélios /
    concurrents, par région puis par département (top 15).
  - **Répartition par Marque** — classement des marques par nombre
    d'opticiens qui les distribuent (`src/components/RankedBarList.jsx`),
    les deux marques Thélios (Barton Perreira, Vuarnet) mises en évidence en
    doré.
  - **Proportion Flagships vs Indépendants** — répartition par type de
    boutique (`src/components/TypeProportionGauge.jsx`) : une jauge en barre
    segmentée (or/argent/bronze) suivie de trois tuiles chiffrées avec
    pourcentages. Repose sur la même classification heuristique que le
    filtre "Type de boutique" (voir plus haut), avec les mêmes limites.
  - **Top Villes les plus denses** — le classement des 10 villes existant
    précédemment, désormais accessible via ce même sélecteur.

Le code doré (`#a67c34`), argenté (`#98a1ad`, réservé aux "Grands Magasins")
et gris anthracite (`#57534e`) repris dans ces graphiques est centralisé dans
`src/utils/palette.js` pour rester cohérent avec le reste de l'app.

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
- **Calibration dynamique** (`src/utils/heatmapCalibration.js`) : le rayon,
  le flou, l'opacité minimale et l'intensité par point ne sont plus des
  valeurs fixes — ils sont recalculés à chaque changement de filtre en
  fonction du nombre de points actuellement affichés. Peu de points (une
  marque de niche, une ville isolée) reçoivent un rayon plus large et une
  intensité plus forte pour rester bien visibles ; beaucoup de points (tout
  le réseau) reçoivent un rayon plus resserré pour que les zones de forte
  densité restent distinguables au lieu de fusionner en une seule tache. Le
  fond de carte se désature et s'assombrit légèrement pendant que la
  heatmap est active (classe `.heatmap-active` sur le conteneur Leaflet,
  filtre CSS dans `src/index.css`), avec une variante encore plus sombre en
  mode sombre — pour que le dégradé or de la heatmap ressorte sans être
  écrasé par les tuiles de fond.
- **Type de point de vente** (`src/components/StoreTypeFilter.jsx`,
  `src/utils/storeType.js`) : filtre les opticiens par "Boutique Flagship",
  "Opticien Indépendant" ou "Grand Magasin".
  > ⚠️ **Ce champ n'existe pas dans les données source.** Il s'agit d'une
  > classification heuristique calculée côté client à partir du nom de
  > l'enseigne (ex. présence de "flagship", ou noms d'enseignes de grands
  > magasins comme Galeries Lafayette, Printemps, BHV, Fnac…) et du nombre de
  > marques distribuées. À affiner ou remplacer dès qu'un champ de
  > typologie réel sera fourni par le client.

## Zones blanches (opportunités de prospection)

Le bouton **Zones blanches** (`src/components/WhiteZonesToggle.jsx`) superpose
sur la carte un calque de cercles pointillés teal (`src/utils/whiteZones.js`)
signalant les villes où :

- au moins 5 opticiens concurrents sont déjà implantés (un volume de marché
  réel, pas juste une boutique isolée) ;
- **aucun** d'entre eux ne distribue une marque Thélios (Barton Perreira ou
  Vuarnet).

Le rayon de chaque cercle est proportionnel au nombre d'opticiens
concurrents dans la ville (survoler un cercle affiche le détail). Ce calque
se superpose aux marqueurs normaux ou à la heatmap — il ne les remplace pas
— et se calcule toujours à partir de l'ensemble du réseau (`stores.json`
complet), indépendamment des filtres actifs, puisqu'une analyse de
prospection perd son sens si elle est déjà restreinte à un sous-ensemble
filtré.

## Optimisation de trajet

Sur chaque fiche opticien (liste ou panneau détaillé), une case à cocher
permet d'ajouter un opticien au trajet — **sans limite de nombre d'arrêts**.
Le panneau flottant `src/components/RoutePlanner.jsx` (bas de la carte)
permet ensuite de :

1. **Optimiser mon trajet** (`optimizeRouteOrder` dans `src/utils/route.js`) :
   calcule l'ordre qui minimise la distance totale à vol d'oiseau, en
   partant de la position géolocalisée du visiteur si elle est disponible.
   Pour rester rapide quel que soit le nombre d'arrêts, deux stratégies sont
   utilisées selon la taille du trajet :
   - **≤ 7 arrêts** : recherche exhaustive par force brute (jusqu'à 5 040
     permutations), qui garantit l'ordre optimal.
   - **> 7 arrêts** : construction par plus proche voisin, puis
     raffinement par recherche locale 2-opt (25 passes maximum). Ce n'est
     pas garanti optimal, mais c'est une heuristique standard pour ce type
     de problème (voyageur de commerce) qui reste rapide même pour des
     tournées de plusieurs dizaines d'arrêts.
2. **Ouvrir dans Google Maps** : lien(s) d'itinéraire multi-étapes
   (`origin`/`waypoints`/`destination`). Google Maps limite chaque lien à 25
   points (origine + jusqu'à 23 étapes + destination) : au-delà,
   `buildGoogleMapsUrls` découpe automatiquement le trajet en plusieurs
   tronçons consécutifs (chaque tronçon repart du dernier point du
   précédent), à ouvrir les uns après les autres — le nombre d'opticiens
   dans la tournée reste donc illimité.
3. **Ouvrir dans Waze** : Waze ne supportant pas les itinéraires
   multi-étapes via lien, ce bouton pointe uniquement vers le premier arrêt
   de l'itinéraire optimisé.

Les arrêts sélectionnés s'affichent sur la carte avec des marqueurs numérotés
et un tracé en pointillés (numérotés par ordre de sélection avant
optimisation, puis par ordre optimisé une fois calculé). La liste des arrêts
dans le panneau devient défilante au-delà d'une certaine hauteur, pour
rester utilisable même avec de nombreux arrêts.

### Export PDF "Fiche de Tournée"

Le bouton **Exporter en PDF** du panneau de trajet (`src/utils/pdfExport.js`,
bibliothèque `jspdf`) génère un PDF téléchargeable contenant :

- un **schéma d'itinéraire** : les arrêts (et la position de départ si la
  géolocalisation est active) reliés dans l'ordre par un tracé en
  pointillés doré, avec des repères numérotés identiques à ceux affichés
  sur la carte. Ce n'est **pas une capture de la carte réelle** — il n'existe
  pas de moyen fiable de rastériser des tuiles Leaflet hors-ligne sans
  dépendre d'un service externe (problèmes de CORS avec les tuiles
  OSM/CartoDB) — mais un schéma vectoriel recalculé à partir des
  coordonnées GPS des arrêts, clairement légendé comme tel ;
- la **liste ordonnée des opticiens** à visiter, avec adresse complète,
  téléphone, marques distribuées, et la note privée déjà saisie pour cet
  opticien (le cas échéant, voir "Ma Carte" plus bas) ;
- un espace **compte-rendu de la journée** avec des lignes pour la prise de
  notes manuscrites ou la frappe d'un compte-rendu une fois le PDF imprimé.

Aucun champ "nom du commercial" n'est demandé dans l'application (l'app n'a
pas de système de comptes, voir "Ma Carte" plus bas) : le PDF laisse
simplement une ligne à remplir à la main pour ça, plutôt que d'ajouter un
faux profil utilisateur. La bibliothèque `jspdf` est chargée par un
`import()` dynamique déclenché uniquement au clic sur le bouton, pour ne pas
alourdir le chargement initial de l'app.

### Export agenda (.ics)

Le bouton **Ajouter à mon agenda (.ics)** du panneau de trajet ouvre une
modale de configuration (`src/components/IcsExportModal.jsx`) offrant deux
modes, puis génère un fichier `.ics` standard (RFC 5545) téléchargé sous le
nom `tournee-AAAA-MM-JJ.ics` :

- **Horaires précis** : une heure de début (09:00 par défaut) et une durée
  moyenne par rendez-vous (45 min par défaut) — chaque étape a un créneau de
  durée fixe.
- **Fenêtres de passage** : une heure de début et une durée de créneau plus
  large (90 à 120 min, 105 min par défaut), pour représenter une fenêtre de
  passage souple plutôt qu'un horaire figé.

Dans les deux cas, le calcul de l'emploi du temps (`src/utils/scheduling.js`)
traite l'intégralité des étapes de la tournée optimisée, sans limite de
nombre de rendez-vous, pour produire un **premier horaire par défaut** :
chaque créneau démarre à la fin du précédent, plus le temps de trajet estimé
jusqu'à l'arrêt suivant. **Aucune API de routing réelle n'étant intégrée
dans l'application** (voir plus haut, la distance utilisée partout est la
distance à vol d'oiseau), ce temps de trajet est une estimation calculée à
partir de la distance haversine entre deux arrêts et d'une vitesse moyenne
théorique de 45 km/h — à considérer comme indicatif, pas comme un temps de
trajet réel calculé par un service de navigation.

Une pause déjeuner automatique d'1h30 est insérée dès que l'horaire calculé
atteint ou dépasse 12:30 ; les rendez-vous suivants reprennent à 14:00.

Cet horaire par défaut n'est qu'un point de départ : la modale affiche
ensuite la liste des rendez-vous avec, pour chacun, un champ heure
librement modifiable indépendamment des autres — aucune grille de créneaux
rigide n'est imposée (on peut par exemple mettre le 1er RDV à 09:15 et le
2ᵉ à 11:00 sans que les étapes suivantes ne se recalculent en cascade).
Modifier l'heure de début, le mode ou la durée régénère cet horaire par
défaut (et donc écrase les ajustements déjà faits sur chaque ligne) — un
changement de réglage global est traité comme une nouvelle proposition de
base, pas comme une contrainte permanente.

La modale inclut aussi un **sélecteur de date** (par défaut la date du jour,
mais librement modifiable vers n'importe quelle date passée ou future) pour
planifier une tournée à l'avance plutôt que de systématiquement l'imposer au
jour même ; le nom du fichier téléchargé (`tournee-AAAA-MM-JJ.ics`) reflète
la date choisie.

Chaque événement du fichier `.ics` suit un format fixe :

- `SUMMARY` : `RDV : [Nom de l'opticien] (Étape [N°])`
- `LOCATION` : l'adresse complète de l'opticien
- `DESCRIPTION` : le temps de trajet estimé depuis l'arrêt précédent (ou une
  mention "premier arrêt" pour la première étape, qui n'a pas de trajet
  précédent)

Ces libellés sont volontairement laissés en français dans le fichier `.ics`
généré, quelle que soit la langue de l'interface, car ce sont des chaînes de
données au format imposé (et non des libellés d'interface) destinées à être
lues dans une application de calendrier tierce, pas dans l'app elle-même.

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
- **Mode sombre** : `neutral-950`/`neutral-900` sont un anthracite mat
  (`#0F1015` pour le fond principal, `#16171F` pour les surfaces légèrement
  surélevées comme les cartes et modales) — volontairement pas un noir pur,
  pour rester "doux" plutôt que dur.
- **Accent doré** : la gamme `amber-*` (utilisée dans toute l'app pour les
  états actifs, bordures au survol, marques Thélios mises en avant…) est
  remplacée par un dégradé bronze/champagne plus feutré que l'orange-ambre
  par défaut de Tailwind, plus proche de l'univers de la haute lunetterie.
  C'est le **seul accent chaud** du mode sombre : aucun orange/rouge/violet
  n'est utilisé ailleurs dans l'interface, pour éviter tout effet
  "Halloween" (un bouton Heatmap actif utilisait par erreur l'orange vif de
  Tailwind par défaut — corrigé pour reprendre ce même accent doré/ambre que
  le reste de l'app). Les couleurs codées en dur en dehors des classes
  Tailwind (marqueurs de carte, dégradé de la heatmap, barres du tableau de
  bord — non affectées par la redéfinition CSS) sont centralisées dans
  `src/utils/palette.js` pour rester alignées avec cette même teinte.
- **Tuiles de carte harmonisées** : en mode sombre, les tuiles CartoDB
  "dark_all" (par défaut plutôt bleu-gris froid) reçoivent un filtre CSS
  (`filter: brightness() saturate() sepia() hue-rotate()` sur
  `.leaflet-tile-pane`, dans `src/index.css`) qui les réchauffe légèrement
  pour rester dans la même famille anthracite/or que le reste de
  l'interface, sans changer de fournisseur de tuiles.
- **Ombres adoucies** : `shadow-md/lg/xl/2xl` sont redéfinies avec une
  diffusion plus large et une opacité plus faible pour un rendu "flottant"
  plus feutré que les ombres par défaut de Tailwind, sur toute l'app
  (panneaux, modales, cartes de résultats).
- Aucune police externe n'a été ajoutée (pour éviter une dépendance réseau à
  un CDN de polices) : l'effet "épuré et raffiné" s'appuie sur la police
  serif système déjà utilisée pour les titres, combinée aux nouveaux
  espacements/couleurs.
- **Favicon** : `public/favicon.ico` (16/32/48 px) et
  `public/apple-touch-icon.png` (180 px) remplacent l'ancien favicon
  générique (une forme abstraite violette sans rapport avec la marque,
  héritée du gabarit de départ du projet). Le nouveau favicon est un
  monogramme "T" recadré directement depuis le vrai logo Thélios
  (`public/logo-thelios.jpg`, même graisse/police que le mot-symbole
  "THĒLIOS"), sur le même fond crème que le logo — pas une création
  arbitraire, juste un recadrage fidèle à l'identité existante. Régénérable
  avec Pillow (`pip install pillow`) si le logo change ; le script utilisé
  n'est pas versionné (traitement ponctuel), mais la logique (recadrage du
  "T" par détection de pixels non-fond, mise à l'échelle sur un canevas
  carré) est documentée ici pour pouvoir être reproduite.

## Connexion, rôles & Administration

> ⚠️ **Simulation locale, pas un vrai système de comptes.** Comme pour "Ma
> Carte" et le code secret des avis, l'app n'a pas de backend : la
> whitelist, les rôles et la session sont stockés dans le `localStorage` de
> cet appareil/navigateur uniquement. Un administrateur qui ajoute un
> e-mail ou change un rôle sur son poste ne rend pas ce changement visible
> sur le poste d'un collègue — il n'y a pas de base de données partagée
> tant qu'aucun backend n'est branché. Ceci a été un choix explicite pour
> valider l'interface et les parcours avant d'investir dans une
> intégration réelle (voir "Architecture pensée pour un vrai backend"
> ci-dessous).

L'app est désormais protégée par un écran de connexion
(`src/components/LoginScreen.jsx`) :

- **Connexion par e-mail, sans mot de passe** : l'utilisateur saisit son
  adresse e-mail ; si elle figure dans la whitelist, l'accès est autorisé.
  Sinon, le message **"Accès non autorisé. Veuillez contacter
  l'administrateur."** s'affiche et bloque l'accès à l'application.
- **Administrateur principal par défaut** :
  `a.lefortdesylouses@thelios.com`, pré-inséminé dans la whitelist avec le
  rôle Admin au premier chargement (`DEFAULT_ADMIN_EMAIL` dans
  `src/services/authService.local.js`).
- **Session persistante sur l'appareil** : une fois connecté, l'utilisateur
  n'a pas à ressaisir son e-mail à chaque visite. La session est
  re-validée contre la whitelist à chaque lecture (pas seulement à la
  connexion) : si un admin retire quelqu'un ou change son rôle, l'effet
  s'applique dès la prochaine action de cet utilisateur plutôt que
  d'attendre une reconnexion.
- **Connexion rapide (Mode Test)** : un bouton de secours sur l'écran de
  connexion permet d'entrer dans l'app en un clic (connecté comme
  l'administrateur par défaut), sans avoir à taper une adresse e-mail —
  pratique pour les démos et les tests, sans remplacer le vrai formulaire
  de connexion au-dessus.
- **Déconnexion** : bouton dédié dans l'en-tête (icône, e-mail affiché en
  info-bulle), ainsi qu'un bouton "Se déconnecter" dans Paramètres >
  Préférences pour ceux qui préfèrent y accéder depuis là.

### Panneau d'Administration

Visible et accessible **uniquement pour les utilisateurs avec le rôle
Admin** — le bouton "Administration" de l'en-tête n'apparaît pas du tout
pour un rôle Commercial (`src/components/Header.jsx`,
`src/components/AdminPanel.jsx`) :

- **Gestion de la Whitelist & des Rôles** : ajouter ou retirer des
  adresses e-mail autorisées à se connecter, et attribuer le rôle Admin
  ou Commercial à chacune via un sélecteur — y compris se retirer
  soi-même ou promouvoir quelqu'un d'autre Admin (utile pour donner le
  rôle au responsable plus tard).
  - **Protection du dernier administrateur** : retirer ou rétrograder le
    seul admin restant est bloqué avec un message explicite, pour ne
    jamais se retrouver sans accès au panneau d'administration sur cet
    appareil.
- **Import d'opticiens (Excel / CSV)** : un fichier `.xlsx` ou `.csv` avec
  des colonnes reconnues automatiquement (nom, adresse, ville, code
  postal, marques, téléphone, e-mail, site web —
  `src/utils/adminStoreImport.js`, `detectImportColumns`) est parsé, puis
  chaque ligne est **géocodée côté client** via l'API publique
  [Base Adresse Nationale](https://adresse.data.gouv.fr/) du gouvernement
  français (même service que les scripts de génération de données
  hors-ligne du projet — voir `scripts/build_stores_from_excel.py` — mais
  sous une forme plus légère adaptée à un import interactif, sans la
  passe de validation croisée par code postal de ce script). Une barre de
  progression affiche le géocodage en temps réel (`X / Y`). Les lignes
  qui échouent au géocodage sont listées séparément dans le résumé plutôt
  que silencieusement ignorées.
  - Les opticiens importés sont fusionnés avec `stores.json` au moment de
    l'affichage (`src/services/storesService.local.js`,
    `mergeWithOverrides`) : un id déjà existant est remplacé, un nouvel id
    est ajouté à la liste. **Cette fusion reste elle aussi propre à
    l'appareil** — ce n'est pas une mise à jour de la base de données
    partagée.
- Un bandeau d'avertissement rappelant la nature locale de la simulation
  est affiché en permanence en haut du panneau.

### Architecture pensée pour un vrai backend

Le code a été volontairement écrit avec un point de bascule net pour
brancher un vrai backend (Supabase, Firebase, ou autre) sans toucher au
reste de l'application :

- `src/services/authService.js` et `src/services/storesService.js` sont
  de simples ré-exports (`export * from "./xxxService.local"`) — tout le
  reste de l'app importe exclusivement depuis ces deux fichiers, jamais
  directement depuis leur implémentation `.local.js`.
- Pour passer à un vrai backend, il suffit de remplacer le contenu de ces
  deux fichiers par une implémentation qui respecte la même interface
  (mêmes fonctions exportées, mêmes formes de retour) — aucun composant
  consommateur (`LoginScreen`, `AdminPanel`, `Header`, `App.jsx`...) n'a
  besoin d'être modifié.
- Les fichiers `*.local.js` documentent en tête de fichier, en détail,
  pourquoi leur implémentation actuelle est une simulation par appareil
  et non un vrai système multi-utilisateurs.

## Rubrique Paramètres

Le bouton **Paramètres** de l'en-tête, accessible à **tous les
utilisateurs connectés** (peu importe leur rôle), ouvre une modale à deux
onglets (`src/components/SettingsPanel.jsx`) :

- **Préférences** :
  - **Langue de l'interface** : les mêmes boutons FR / EN que le
    sélecteur de l'en-tête (voir la section "Langue (FR / EN)" plus haut),
    dupliqués ici pour un accès direct depuis les réglages.
  - **Changer le code secret** des avis clients (reprend, inchangée, la
    fonctionnalité qui vivait auparavant dans un composant dédié
    `SecretCodeSettings.jsx` — désormais fusionné ici).
- **Aide & FAQ** :
  - **Statuts & codes couleurs** : rappel visuel des 4 statuts CRM
    utilisés dans "Mon Carnet" (Client actif, Prospect à contacter, RDV à
    fixer, Refus), avec leur pastille de couleur et une explication de
    chacun.
  - **Guide d'utilisation sur le terrain** : questions/réponses courtes
    sur les parcours clés (préparer sa tournée, enregistrer un
    compte-rendu de visite, exporter vers l'agenda, envoyer son rapport
    de fin de journée...), pour un commercial en déplacement qui a besoin
    d'un rappel rapide sans documentation externe.

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

### Statuts et étiquettes (CRM léger)

Dans la fiche détaillée de chaque opticien (`src/components/StatusSelector.jsx`,
`src/components/TagPicker.jsx`) :

- **Statut** : un seul statut à la fois parmi Client actif (vert), Prospect
  à contacter (bleu), RDV à fixer (terracotta) ou Refus (rouge) — cliquer un
  statut déjà actif le retire. Les couleurs (`STATUS_COLORS` dans
  `src/utils/palette.js`) sont volontairement adoucies plutôt que vives,
  pour rester dans le registre sobre du reste de l'app.
- **Étiquettes** : trois étiquettes prédéfinies (Premium, Besoin de PLV,
  Collection Solaire uniquement) à cocher/décocher, plus un champ pour
  ajouter des étiquettes libres.

Ces deux informations sont reflétées visuellement à trois endroits :

1. Un point de couleur sur chaque fiche de la liste (`src/components/StatusDot.jsx`).
2. Dans "Ma Carte" uniquement, la couleur des marqueurs sur la carte
   elle-même passe du code or/gris habituel (marque Thélios vs concurrent)
   au code couleur du statut — plus pertinent une fois qu'on suit ses propres
   relations client que la distinction par marque à l'échelle du réseau.
   La légende en bas à gauche de la carte s'adapte en conséquence.
3. Un filtre "Filtrer par statut" dans le panneau "Ma Carte", pour n'afficher
   que les opticiens d'un ou plusieurs statuts donnés.

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

## Mon Carnet

Un troisième mode dans le même sélecteur (`src/components/ViewModeToggle.jsx`)
bascule vers **Mon Carnet** — un espace de travail CRM en plein écran qui
**masque entièrement la carte interactive** (elle est démontée du DOM tant
que ce mode est actif, pas juste masquée en CSS ; elle se remonte normalement
en revenant sur Carte Globale ou Ma Carte). Contrairement à "Ma Carte", ce
n'est pas une vue cartographique alternative mais un tableau de bord organisé
en quatre onglets internes (`src/components/CarnetView.jsx`), qui opèrent
tous sur le même ensemble "personnel" que "Ma Carte" (portefeuille importé +
favoris).

### 📋 Tableau

`src/components/CarnetTableTab.jsx` liste l'intégralité du portefeuille sous
forme de tableau : nom, ville, code postal/département, marques distribuées,
statut, priorité, date de dernier contact et actions. Une recherche
(nom/ville/marque) et des badges de statut cliquables (🟢 Client actif,
🔵 Prospect, 🟠 RDV à fixer, 🔴 Refus — réutilisant les mêmes
`STORE_STATUSES`/`STATUS_COLORS` que "Ma Carte") filtrent les lignes.

- **Marques Thélios** : badges discrets par opticien (mêmes styles que
  partout ailleurs dans l'app — une marque `FEATURED_BRANDS` ressort en
  plein, les autres restent en ton pastel).
- **Potentiel / Priorité** : un niveau facultatif (⭐ Élevée / Moyenne /
  Faible, ou non renseigné) propre à "Mon Carnet", stocké séparément du
  statut CRM (`PRIORITY_LEVELS`/`getPriorities`/`setPriority` dans
  `src/utils/myCard.js`) — jamais montré ailleurs dans l'app.
- **Code Postal / Dép.** : extrait de l'adresse (`getStoreZip`/
  `getStoreDeptCode` dans `src/utils/postalCode.js`, déjà utilisés pour les
  filtres géographiques), pour trier ou repérer un secteur d'un coup d'œil.
- **Statut** et **Priorité** sont modifiables directement dans la ligne via
  un menu déroulant ("saisie rapide") — pas besoin d'ouvrir la fiche
  détaillée de l'opticien.
- **En-têtes de colonnes cliquables** (Nom, Ville, Code Postal, Statut,
  Priorité, Dernier Contact) trient le tableau, croissant puis décroissant
  au clic suivant sur la même colonne (un chevron indique la colonne et le
  sens actifs).
- **Actions rapides**, en icônes compactes : 📝 ouvrir/ajouter une note
  (bascule sur l'onglet Bloc-Notes avec cet opticien pré-sélectionné),
  📅 programmer un RDV (ajoute l'opticien au trajet en cours et bascule sur
  l'onglet Agenda), 📞 appeler (lien `tel:`, désactivé si l'opticien n'a pas
  de numéro renseigné — les numéros de `stores.json` ne sont pas tous au
  même format, ils sont normalisés à la volée avant de construire le lien),
  🗺️ voir sur la carte (quitte Mon Carnet, revient sur Carte Globale et
  ouvre directement la fiche détaillée de cet opticien).

### 📅 Agenda & RDV

`src/components/CarnetAgendaTab.jsx` réutilise le même état de trajet
(`routeStops`/`routeOrder`) que le planificateur flottant de la carte : un
arrêt ajouté depuis le Tableau, ou depuis la Carte Globale, apparaît des deux
côtés. Cet onglet affiche la liste des étapes programmées, un bouton
**Optimiser mon trajet** (même moteur que sur la carte, voir "Optimisation
de trajet" plus haut) et un accès direct au réglage de l'export agenda
(`.ics`, voir plus haut) — sans avoir besoin de rouvrir la carte.

### 📝 Bloc-Notes Client

`src/components/CarnetNotesTab.jsx` permet de sélectionner un opticien du
portefeuille et de consulter/ajouter des **notes de visite datées** —
horodatées automatiquement à l'ajout. C'est un système distinct de la
"Note privée" (texte libre unique) déjà présente dans le panneau détaillé de
la carte : celui-ci reste un pense-bête simple, alors que le Bloc-Notes de
Mon Carnet tient un historique chronologique de visites
(`src/utils/activity.js`, clé `localStorage` séparée), qui sert aussi de
source pour la colonne "Dernier Contact" du Tableau et pour l'onglet
Performance ci-dessous.

### 📊 Performance & Historique

`src/components/CarnetPerformanceTab.jsx` compare, pour la semaine en cours
vs la semaine dernière et le mois en cours vs le mois dernier
(`src/utils/dateRanges.js`, semaines ISO du lundi au dimanche), trois
indicateurs (`src/utils/performance.js`) :

- **Visites réalisées** : nombre de notes de visite datées ajoutées sur la
  période.
- **Nouveaux prospects contactés** : nombre d'opticiens passés au statut
  Prospect **pour la première fois** sur la période (un opticien qui reste
  simplement Prospect d'une période à l'autre n'est pas recompté — la date
  de premier passage au statut Prospect est mémorisée séparément dans
  `src/utils/activity.js`).
- **Taux de couverture du secteur** : part du portefeuille ayant reçu au
  moins une visite datée sur la période.

> ⚠️ **Ces indicateurs sont calculés uniquement à partir de l'activité
> enregistrée dans cette application, sur cet appareil** (comme tout "Ma
> Carte"/"Mon Carnet", il n'y a pas de backend). L'app n'a pas de notion
> réelle de secteur commercial ni d'historique d'appels/visites externe à
> l'outil : "taux de couverture du secteur" est une approximation
> raisonnable construite à partir de l'activité réellement journalisée
> (notes de visite), pas une donnée de territoire commercial officielle.
> Le détail de la méthodologie est rappelé directement sous les indicateurs
> dans l'interface.

### 📋 Rapport de fin de journée

Le bouton **Générer le rapport de fin de journée**, dans la barre d'onglets
de "Mon Carnet" (accessible depuis n'importe quel onglet), ouvre une modale
(`src/components/EndOfDayReportModal.jsx`) — pas la tournée planifiée (ça,
c'est le rôle de l'onglet Agenda & RDV et de son export `.ics`) :

- **Sélection par case à cocher** : la modale liste tous les opticiens du
  portefeuille ("Ma Carte"), chacun avec une case à cocher — le commercial
  coche ceux qu'il a **réellement visités** aujourd'hui, sans être limité
  aux opticiens ayant déjà une note datée. Les opticiens ayant une note de
  visite datée du jour dans l'onglet Bloc-Notes sont pré-cochés par défaut
  (`src/utils/endOfDayReport.js`, `buildReportRows`) — un point de départ
  pratique que le commercial reste libre de corriger avant export (oubli
  de note, visite non prévue à l'origine, etc.). Une **barre de recherche**
  au-dessus de la liste filtre par nom, ville ou code postal — utile pour
  un portefeuille conséquent, sans jamais décocher les opticiens déjà
  sélectionnés en dehors du résultat filtré (la sélection reste
  indépendante de la recherche affichée).
- Un champ **Note individuelle** par opticien coché, pré-rempli à partir de
  la note de visite du jour la plus récente pour cet opticien quand elle
  existe — modifiable directement dans la modale avant export (édition
  rapide, sans avoir à retourner dans le Bloc-Notes).
- L'en-tête reprend la date du jour, un champ **Nom du commercial** (texte
  libre, mémorisé dans le `localStorage` de l'appareil pour ne pas avoir à
  le ressaisir chaque jour — toujours pas un vrai système de comptes) et le
  nombre d'opticiens cochés.
- **Synthèse Globale de la Journée** : un champ de texte libre pour un
  bilan général.
- **Autres missions / Tâches annexes** : un second champ de texte libre
  distinct, pour les activités de la journée qui ne correspondent à aucune
  visite d'opticien (formation interne, réunion d'équipe, préparation de
  showroom, rendez-vous manqué chez un prospect...) — pour que le rapport
  reflète toute la journée du commercial, pas seulement les visites
  cochées.
- **Deux formats d'export**, tous deux générés côté client à partir des
  mêmes données (aucun aller-retour serveur) :
  - **PDF** (`src/utils/endOfDayReportPdf.js`, `jspdf`) : mise en page
    directement imprimable/partageable, avec un encadré propre par
    opticien.
  - **Word (.docx)** (`src/utils/endOfDayReportDocx.js`, bibliothèque
    [`docx`](https://www.npmjs.com/package/docx) — vérifiée via `npm audit`
    avant intégration, 0 vulnérabilité) : un vrai fichier `.docx` éditable
    dans Word ou Google Docs (chaque opticien dans un tableau à une cellule
    avec bordures et fond légèrement teinté, pour le même effet
    "encadrement propre" qu'en PDF), pensé pour que le commercial puisse
    enrichir ou corriger le rapport après coup, depuis son ordinateur ou
    son téléphone.
  - La modale reste ouverte après un export pour permettre de télécharger
    l'autre format sans avoir à tout ressaisir.
  - Les deux bibliothèques (`jspdf` et `docx`) sont chargées par un
    `import()` dynamique déclenché uniquement au clic sur le bouton de
    téléchargement correspondant, pour ne pas alourdir le chargement
    initial de l'app (`docx` apparaît comme un chunk séparé dans le build,
    voir `npm run build`).

## Prochaine étape (non traitée dans cette itération)

Le système de connexion, de rôles (Admin / Commercial) et le panneau
d'administration ont été implémentés (voir "Connexion, rôles &
Administration" plus haut), mais **en simulation locale uniquement** — un
choix explicite pour valider l'interface et les parcours avant d'investir
dans un vrai backend. Ce qui reste à faire pour une mise en production
réelle multi-utilisateurs :

- Remplacer `src/services/authService.js` et
  `src/services/storesService.js` par une implémentation branchée sur un
  vrai backend (Supabase, Firebase, ou autre) — c'est le point de bascule
  prévu pour ça, aucun autre fichier n'a besoin d'être modifié.
- Idem pour les avis clients (`src/utils/storage.js`) et "Ma Carte"
  (`src/utils/myCard.js`, `src/utils/activity.js`) : mêmes limites de
  stockage local par appareil, pour les mêmes raisons.
