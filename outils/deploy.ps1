# Déploie le site sur l'hébergement o2switch : git pull dans le dossier servi, via SSH.
# Lit outils/deploy.conf (à créer depuis deploy.conf.example).
$ErrorActionPreference = "Stop"
$conf = Join-Path $PSScriptRoot "deploy.conf"
if (-not (Test-Path $conf)) {
    Write-Error "Fichier outils/deploy.conf absent : le créer à partir de deploy.conf.example."
    exit 1
}
$vars = @{}
foreach ($line in Get-Content $conf) {
    if ($line -match '^\s*([A-Z_]+)\s*=\s*"(.*)"\s*$') { $vars[$Matches[1]] = $Matches[2] }
}
Write-Host "Déploiement : ssh $($vars.O2S_SSH) (git pull dans $($vars.O2S_PATH))"
ssh $vars.O2S_SSH "cd $($vars.O2S_PATH) && git pull --ff-only"
