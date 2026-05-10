# API Examples

These examples use PowerShell and demo auth headers. Use `X-Demo-User-Id: 1` for admin actions and `X-Demo-User-Id: 2` for operator actions.

Run through Nginx:

```powershell
$Base = "http://localhost:8088/api"
$Admin = @{ "X-Demo-User-Id" = "1" }
$Operator = @{ "X-Demo-User-Id" = "2" }
$Json = "application/json"
```

Run directly against the backend:

```powershell
$Base = "http://localhost:8000"
```

## Health

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/health"
Invoke-RestMethod -Uri "http://localhost:8000/ready"
```

## 1. Create Dataset

```powershell
$DatasetBody = @{
  name = "Orders"
  description = "Orders source metadata"
  owner = "Data Team"
  source_type = "csv_file"
  schema_version = "v1"
} | ConvertTo-Json

$Dataset = Invoke-RestMethod `
  -Method Post `
  -Uri "$Base/datasets" `
  -Headers $Admin `
  -ContentType $Json `
  -Body $DatasetBody

$Dataset
```

## 2. Create Pipeline

```powershell
$PipelineBody = @{
  dataset_id = $Dataset.id
  name = "Orders daily load"
  description = "Simulated daily ETL pipeline"
  schedule = "*/15 * * * *"
  active = $true
  engine = "python"
  processing_mode = "batch"
  load_type = "incremental"
  target_layer = "l1_clean"
} | ConvertTo-Json

$Pipeline = Invoke-RestMethod `
  -Method Post `
  -Uri "$Base/pipelines" `
  -Headers $Admin `
  -ContentType $Json `
  -Body $PipelineBody

$Pipeline
```

## Optional: Create Active Pipeline Version

Use deterministic config when you want predictable demo results.

```powershell
$VersionBody = @{
  version_number = 1
  active = $true
  config_json = @{
    force_failure = $true
    fail_step = "transform"
    runtime_seconds = 8
    records_processed = 100
    step_sleep_seconds = 0
  }
} | ConvertTo-Json -Depth 5

$Version = Invoke-RestMethod `
  -Method Post `
  -Uri "$Base/pipelines/$($Pipeline.id)/versions" `
  -Headers $Admin `
  -ContentType $Json `
  -Body $VersionBody

$Version
```

## 3. Create Alert Rule

```powershell
$RuleBody = @{
  pipeline_id = $Pipeline.id
  name = "Run failed"
  condition_type = "run_failed"
  threshold_seconds = $null
  threshold_records = $null
  enabled = $true
} | ConvertTo-Json

$Rule = Invoke-RestMethod `
  -Method Post `
  -Uri "$Base/alert-rules" `
  -Headers $Admin `
  -ContentType $Json `
  -Body $RuleBody

$Rule
```

## 4. Run Pipeline

```powershell
$RunBody = @{
  trigger_type = "manual"
} | ConvertTo-Json

$Run = Invoke-RestMethod `
  -Method Post `
  -Uri "$Base/pipelines/$($Pipeline.id)/run" `
  -Headers $Operator `
  -ContentType $Json `
  -Body $RunBody

$Run
```

The API returns immediately with a queued run. The worker processes it asynchronously.

## 5. Inspect Run

```powershell
Invoke-RestMethod -Uri "$Base/runs/$($Run.id)" -Headers $Operator
Invoke-RestMethod -Uri "$Base/pipelines/$($Pipeline.id)/runs" -Headers $Operator
```

## 6. Inspect Alerts

```powershell
$Alerts = Invoke-RestMethod -Uri "$Base/alerts" -Headers $Operator
$Alerts
```

If the deterministic failing version was created, an open alert should appear after the worker processes the run.

## 7. Acknowledge And Resolve Alert

```powershell
$Alert = $Alerts[0]

Invoke-RestMethod `
  -Method Patch `
  -Uri "$Base/alerts/$($Alert.id)/acknowledge" `
  -Headers $Operator

Invoke-RestMethod `
  -Method Patch `
  -Uri "$Base/alerts/$($Alert.id)/resolve" `
  -Headers $Operator
```

## Read-Only Viewer Check

```powershell
$Viewer = @{ "X-Demo-User-Id" = "3" }

Invoke-RestMethod -Uri "$Base/datasets" -Headers $Viewer
```

Viewer reads should succeed. Write requests should return `403`.
