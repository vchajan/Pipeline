$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$composeArgs = if ($args.Count -gt 0) { $args } else { @("up", "--build") }

Push-Location $repoRoot
try {
    docker compose -f docker-compose.yml -f docker-compose.keycloak.yml @composeArgs
}
finally {
    Pop-Location
}
