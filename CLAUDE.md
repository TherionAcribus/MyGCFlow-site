# Site MyGCFlow

Site de présentation de l'application MyGCFlow. Dépôt distinct de l'application.

## Projet lié : l'application

Le code de l'application est dans le dossier voisin `../GCMap`
(dépôt GitHub `TherionAcribus/MyGCFlow`). Il sert de source de vérité pour
le contenu du site : fonctionnalités, captures, notes de version, procédure
d'installation.

- `../GCMap/README.md` et `../GCMap/README.fr.md` : présentation et installation.
- `../GCMap/docs/` : documentation, dont `distribution.md` (mises à jour via
  les Releases GitHub) et `release_notes/`.
- `../GCMap/static/` et `../GCMap/templates/` : interface, utile pour les captures.

Lire l'application, ne pas la modifier depuis ce dépôt. Une modification de
l'app se fait dans son propre dépôt, avec ses propres commits.

## Identité visuelle

`MyGCFlow-identite/` contient le kit de logos (voir `MyGCFlow-identite/LIRE-MOI.md`).

- Couleurs : marine `#082747`, vert `#29D34E`, turquoise `#00C5A1`,
  bleu `#009DFF`, blanc `#FFFFFF` (détail dans `palette.json`).
- Police : Montserrat ExtraBold (800) pour les titres ; fichier et licence OFL
  dans `sources/`.
- Visuel de partage social : `png/mygcflow-social-1280x640.png`.

## Le site

Statique, sans build ni dépendance : `index.html`, `assets/css/style.css`,
`assets/js/main.js`. Organisation et points de modification dans `README.md`.

Les captures et la vidéo d'accroche sont de vraies sorties de l'application, faites avec
des données fictives : ne jamais y mettre de trouvailles réelles (méthode dans `README.md`).

Ton : humble. L'app est en alpha ; ne rien annoncer qu'elle ne fait pas, et
présenter la feuille de route sans date. Les animations respectent
`prefers-reduced-motion`.

## Langue

Le contenu, les commits et les commentaires sont en français.
