# Domain Model

The bounded context is pipeline monitoring and execution simulation.

```text
User

Dataset <- Pipeline <- PipelineVersion
             ^
          JobRun
             ^
        JobRunStep

Pipeline <- AlertRule <- AlertEvent

Operational:
AuditLog, OutboxEvent, WorkerHeartbeat, SchedulerHeartbeat
```

## Entities

### User

Represents an authenticated user known to the system.

Fields include email, display name, role and external subject.

Roles:

- `admin`
- `operator`
- `viewer`

### Dataset

Represents source metadata. A dataset is not the real data itself; it is evidence about a source.

Examples of source type:

- `oltp_database`
- `csv_file`
- `api`
- `event_stream`
- `data_lake`

### Pipeline

Represents a process definition over a dataset.

Fields include schedule, active flag, engine, processing mode, load type and target layer.

Examples:

- engine: `python`, `sql`, `spark`, `databricks`, `aws_glue`
- processing mode: `batch`, `streaming`, `lambda`, `kappa`
- load type: `full`, `incremental`

### PipelineVersion

Represents a versioned execution configuration for a pipeline. The active version controls worker simulation behavior.

Config examples:

```json
{
  "failure_probability": 0.2,
  "force_failure": true,
  "fail_step": "transform",
  "runtime_seconds": 8,
  "records_processed": 100
}
```

### JobRun

Represents one execution instance of a pipeline.

Statuses:

- `pending`
- `queued`
- `running`
- `success`
- `failed`
- `cancelled`

Valid transitions:

- `pending -> queued`
- `queued -> running`
- `queued -> cancelled`
- `running -> success`
- `running -> failed`
- `running -> cancelled`

### JobRunStep

Represents an activity inside a run.

Default steps:

- `extract`
- `transform`
- `load`

### AlertRule

Represents a business rule evaluated against run outcomes.

Conditions:

- `run_failed`
- `runtime_exceeded`
- `records_below_threshold`
- `pipeline_not_run_on_schedule`
- `step_failed`

### AlertEvent

Represents an incident created by an alert rule.

Statuses:

- `open`
- `acknowledged`
- `resolved`

Severities:

- `low`
- `medium`
- `high`
- `critical`

## Operational Entities

- AuditLog: traceable user/system action
- OutboxEvent: stored integration event for future publishing
- WorkerHeartbeat: worker status and current run
- SchedulerHeartbeat: scheduler status and created-run count

## Business Rules

- Pipeline can be created only for an existing Dataset.
- Pipeline can run only when active is true.
- Pipeline can have only one active PipelineVersion.
- Backend creates queued JobRuns and steps; worker processes them asynchronously.
- Alerts are created when rule conditions match.
- RBAC controls write actions.
