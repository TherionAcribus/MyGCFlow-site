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
index.html            la page, en français
en.html               la même page, en anglais (liens croisés FR/EN dans la nav)
assets/css/style.css  styles (couleurs du kit en variables, mode sombre automatique)
assets/js/main.js     vidéo d'accroche, galerie des thèmes, vidéo YouTube,
                      dernière version, apparitions (chaînes FR/EN selon <html lang>)
.htaccess             renvoie 404 sur /.git* (le docroot est un clone git)
assets/fonts/         Montserrat 600–800, réduite aux caractères latins (22 Ko)
assets/img/           logos et favicons copiés depuis le kit
assets/img/app/       captures de l'application (thèmes, interface, trajet, mode Évolution)
assets/video/         vidéo d'accroche, exportée par l'application (WebM et MP4)
outils/captures/      scripts qui ont produit les captures (voir plus bas)
MyGCFlow-identite/    kit d'identité complet (source, non utilisé directement par la page)
```

## Modifier

- **Vidéo** : remplacer `data-youtube-id` dans `index.html`. Pour une deuxième vidéo,
  dupliquer le bloc `<figure class="video">`. Rien n'est chargé depuis YouTube avant le clic.
- **Version et liens de téléchargement** : mis à jour automatiquement depuis l'API GitHub
  (`releases/latest`). Les valeurs écrites dans le HTML ne servent que si l'API ne répond pas.
- **Feuille de route** : section `#a-venir` de `index.html`.
- **Thèmes** : un `<li>` par thème dans `.gallery-thumbs` (lien vers l'image, `data-name`,
  `data-caption`).

## Captures de l'application

Toutes les images de `assets/img/app/` et la vidéo d'accroche sont de vraies sorties de
l'application, faites avec des **données fictives** (aucune trouvaille réelle) :
1 736 caches inventées pour le mode principal, 5 953 pour le mode Évolution.

Les scripts de `outils/captures/` gardent la trace de la méthode. Ils ont tourné depuis un
dossier temporaire et gardent des chemins de cette machine (import de Playwright depuis
`../GCMap/node_modules`, port 5021) : à relire avant de les relancer.

1. `node make_gpx.mjs demo-finds.gpx` et `node make_csv.mjs "Zone de démonstration.csv"`
   génèrent les données.
2. Lancer l'application dans un runtime jetable, depuis `../GCMap` :
   `MYGCFLOW_E2E_RUNTIME=<dossier>/runtime MYGCFLOW_E2E_PORT=5021 .venv/Scripts/python.exe tests/e2e/run_server.py`
3. Avec Node 22 : `shot1.mjs` (import du GPX, interface), `shot2.mjs` (un thème par image,
   animation en pause), `shot3.mjs` (trajet, mode Évolution), `export.mjs` (vidéo exportée
   par l'application).
4. Convertir en WebP (1040 px de large) et réencoder la vidéo avec ffmpeg.

## Déploiement (o2switch)

Le site est servi depuis un clone du dépôt placé dans le docroot du domaine ;
`outils/deploy.sh` déclenche le `git pull` par SSH. Mise en place, une fois :

1. cPanel → **Autorisation SSH** : mettre son IP en liste blanche. La connexion
   utilise l'identifiant/mot de passe cPanel ; déposer une clé publique dans
   `~/.ssh/authorized_keys` sur l'hébergement évite de le retaper.
2. Sur le serveur, peupler le dossier servi avec le dépôt. Toutes les URLs du
   site sont relatives : un sous-dossier du docroot fonctionne tel quel.

   ```bash
   mkdir -p ~/public_html/app/GCMap && cd ~/public_html/app/GCMap
   git init
   git remote add origin https://github.com/TherionAcribus/MyGCFlow-site.git
   git fetch origin
   git checkout -f -b main --track origin/main
   ```

   Le `-f` écrase les éventuels fichiers de placeholder existants. Si le dépôt
   est privé, utiliser une deploy key plutôt que l'URL HTTPS.
3. Copier `outils/deploy.conf.example` en `outils/deploy.conf` (ignoré par git)
   et renseigner `O2S_SSH` et `O2S_PATH`.

Ensuite, `outils\deploy.ps1` (PowerShell) ou `bash outils/deploy.sh` (Git Bash)
applique la dernière version poussée sur `main` — le script se lance en local,
c'est lui qui fait le SSH. Si PowerShell refuse d'exécuter le script :
`powershell -ExecutionPolicy Bypass -File outils\deploy.ps1`.

Le `.htaccess` du dépôt renvoie 404 sur `/.git*`, `/.claude`, `/outils/` et
`/MyGCFlow-identite/` : le clone dans le dossier servi n'est pas exposé.

## À compléter à la mise en ligne

- `og:image` (URL absolue vers `assets/img/mygcflow-social-1280x640.png`) une fois le domaine connu.
