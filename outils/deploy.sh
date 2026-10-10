#!/usr/bin/env bash
# Déploie le site sur l'hébergement o2switch : git pull dans le docroot via SSH.
#
# Pré-requis (une fois), détaillés dans README.md § Déploiement :
#   - IP en liste blanche (cPanel → Autorisation SSH)
#   - dépôt cloné dans le docroot du domaine sur le serveur
#   - outils/deploy.conf créé à partir de deploy.conf.example
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f deploy.conf ]; then
  echo "Fichier outils/deploy.conf absent : le créer à partir de deploy.conf.example." >&2
  exit 1
fi
# shellcheck source=deploy.conf
. ./deploy.conf

echo "Déploiement : ssh $O2S_SSH (git pull dans $O2S_PATH)"
ssh "$O2S_SSH" "cd $O2S_PATH && git pull --ff-only"
