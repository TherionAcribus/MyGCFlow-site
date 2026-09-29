# MyGCFlow — Carte vivante

Kit de logo et d’icônes — 29 septembre 2026.

La piste 2 a été reconstruite en véritables vecteurs : carte pliée, parcours et symbole du géocaching. Le chemin du fichier `Geocaching.svg` fourni est conservé à l’identique ; seules sa taille, sa position et sa couleur changent. La géométrie a été vérifiée dans tous les SVG livrés.

## Les fichiers à utiliser en premier

| Usage | Fichier |
| --- | --- |
| Exécutable Windows, raccourci et installateur | `windows/mygcflow.ico` |
| Icône de l’application, grand format | `png/mygcflow-icone-512.png` |
| Logo horizontal pour fond clair | `svg/mygcflow-logo-horizontal-couleur.svg` |
| Logo horizontal pour fond sombre | `svg/mygcflow-logo-horizontal-fond-sombre.svg` |
| Logo vertical, proche de la proposition choisie | `svg/mygcflow-logo-vertical-couleur.svg` |
| Symbole seul, sans fond marine | `svg/mygcflow-symbole.svg` |
| Favicon | `web/favicon.ico` et `web/favicon.svg` |
| Présentation de l’identité | `apercus/planche-identite.png` |
| Galerie avec variantes et tailles réelles | `apercus/index.html` |

## Contenu du kit

- **svg/** : symbole, icône, logos horizontaux et verticaux, versions couleur, pour fond sombre, monochromes marine et blanches. Tous les SVG de ce dossier ont leurs lettres converties en courbes : aucun besoin d’installer une police. Aucune image matricielle n’est incorporée.
- **png/** : icône et symbole en 16, 20, 24, 32, 40, 48, 64, 96, 128, 192, 256, 512 et 1024 pixels. Logos horizontaux en 2610 × 840 et verticaux en 2000 × 1660, sur fond transparent. Visuel social en 1280 × 640 sur fond marine.
- **windows/** : ICO 32 bits avec transparence, contenant 16, 20, 24, 32, 40, 48, 64, 96, 128 et 256 pixels. Les images internes utilisent le format bitmap pour une compatibilité large avec les outils Windows.
- **web/** : favicon ICO 16/32/48, favicon SVG, PNG 16/32/48, icône Apple 180, icônes 192 et 512, variante « maskable » 512 avec marge de sécurité, manifeste et exemple de balises HTML.
- **integration/** : copies prêtes à placer aux chemins utilisés par MyGCFlow.
- **sources/** : symbole original, logo avec texte modifiable, police Montserrat et sa licence OFL.
- **palette.json** : couleurs et typographie.
- **verification.json** : contrôles de géométrie, de formats et de dimensions.

Les PNG du symbole et des logos sont transparents. L’icône à carré arrondi possède un fond marine et des coins transparents. Les icônes Apple et de manifeste ont un fond opaque ; la variante maskable est prévue pour le recadrage par le système.

## Intégration dans le projet actuel

Les chemins ont été vérifiés dans le dépôt GitHub `TherionAcribus/MyGCFlow` le 29 septembre 2026.

1. Copier `integration/static/img/mygcflow-icon.png` vers `static/img/mygcflow-icon.png` du projet. Ce fichier est lu par `launcher.py` pour la zone de notification et référencé par le README.
2. Copier `integration/installer/mygcflow.ico` vers `installer/mygcflow.ico`. Ce nom est déjà utilisé par `installer/mygcflow.spec` et par `SetupIconFile` dans `installer/mygcflow.iss`.
3. Le SVG `integration/static/img/mygcflow-icon.svg` est disponible en complément pour l’interface web ; son emploi exige une référence explicite dans les pages.
4. Pour les favicons et les icônes web, copier le contenu de `web/` dans `static/branding/`, puis reprendre les balises de `web/integration.html` dans l’en-tête HTML commun. Adapter le préfixe d’URL si l’application est servie sous un sous-chemin. Le manifeste ne crée pas, à lui seul, une application PWA installable.
5. Reconstruire l’exécutable et l’installateur pour incorporer le nouvel ICO. Redémarrer l’application pour recharger l’icône de notification. Le navigateur et Windows peuvent conserver temporairement une ancienne icône en cache.

Le kit a été préparé et contrôlé séparément ; aucun fichier du dépôt n’a été remplacé, aucun commit n’a été créé et l’application n’a pas été reconstruite.

## Utilisation graphique

Couleurs : marine `#082747`, vert `#29D34E`, turquoise `#00C5A1`, bleu `#009DFF`, blanc `#FFFFFF`. Le dégradé suit la carte de gauche à droite.

Typographie : **Montserrat ExtraBold, graisse 800**. Les fichiers de production sont autonomes ; la version `sources/mygcflow-logo-texte-editable.svg` conserve du texte pour les modifications futures. Installer la police incluse avant de modifier cette version.

Préférer les logos sans fond dans les documents et pages web. Employer la version avec nom blanc sur un fond sombre. Les versions monochromes utilisent des évidements transparents dans la carte pour laisser apparaître le support.

Les PNG et les entrées ICO jusqu’à 32 pixels ont une carte légèrement agrandie et un parcours renforcé pour améliorer leur lecture. Le tracé du symbole fourni reste inchangé. À 16 pixels, les détails de la croix deviennent nécessairement très fins : la silhouette de la carte et les couleurs assurent la reconnaissance. Pour montrer le symbole en détail, privilégier 48 pixels ou davantage.

Ne pas déformer le logo ; redimensionner en conservant ses proportions. Les espaces autour du dessin sont intégrés aux SVG. Les fontes sont converties en courbes dans les exports pour empêcher une substitution typographique sur un autre ordinateur.

## Sources

Symbole : fichier `Geocaching.svg` fourni par l’utilisateur, copie originale conservée dans `sources/Geocaching-original.svg`.

Police : Montserrat, [répertoire officiel Google Fonts](https://github.com/google/fonts/tree/main/ofl/montserrat), licence SIL Open Font License incluse. La licence OFL concerne la police ; elle ne constitue pas une licence pour le symbole fourni.

Ce kit est construit directement en SVG avec exports raster ; il ne reprend pas la croix générique des premières propositions et ne dépend pas de leurs images générées.
