$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$composeFiles = @("-f", "docker-compose.yml", "-f", "docker-compose.keycloak.yml")
$remoteFile = "/tmp/pipeline-monitor-realm.json"
$localFile = Join-Path $PSScriptRoot "pipeline-monitor-realm.json"

Push-Location $repoRoot
try {
    docker compose @composeFiles exec -T keycloak /opt/keycloak/bin/kc.sh export --realm pipeline-monitor --file $remoteFile --users realm_file
    docker compose @composeFiles cp "keycloak:$remoteFile" $localFile
    Write-Host "Exported pipeline-monitor realm to $localFile"
}
finally {
    Pop-Location
}
