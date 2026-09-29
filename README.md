# Site MyGCFlow

Site de présentation de [MyGCFlow](https://github.com/TherionAcribus/MyGCFlow).
Site statique : HTML, CSS et JavaScript sans dépendance ni outil de build.

## Prévisualiser

```powershell
py -m http.server 8000
```

Puis ouvrir <http://localhost:8000>. Ouvrir `index.html` directement fonctionne aussi,
sauf la récupération de la dernière version publiée.

## Organisation

```
index.html            la page
assets/css/style.css  styles (couleurs du kit en variables, mode sombre automatique)
assets/js/main.js     rediffusion animée, maquette de matrice, vidéo, dernière version, apparitions
assets/fonts/         Montserrat 600–800, réduite aux caractères latins (22 Ko)
assets/img/           logos et favicons copiés depuis le kit
MyGCFlow-identite/    kit d'identité complet (source, non utilisé directement par la page)
```

## Modifier

- **Vidéo** : remplacer `data-youtube-id` dans `index.html`. Pour une deuxième vidéo,
  dupliquer le bloc `<figure class="video">`. Rien n'est chargé depuis YouTube avant le clic.
- **Version et liens de téléchargement** : mis à jour automatiquement depuis l'API GitHub
  (`releases/latest`). Les valeurs écrites dans le HTML ne servent que si l'API ne répond pas.
- **Feuille de route** : section `#a-venir` de `index.html`.

## À compléter à la mise en ligne

- `og:image` (URL absolue vers `assets/img/mygcflow-social-1280x640.png`) une fois le domaine connu.
