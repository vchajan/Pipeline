export type UserRole = "admin" | "operator" | "viewer";
export type DatasetSourceType = "oltp_database" | "csv_file" | "api" | "event_stream" | "data_lake";
export type PipelineEngine = "python" | "sql" | "spark" | "databricks" | "aws_glue";
export type ProcessingMode = "batch" | "streaming" | "lambda" | "kappa";
export type LoadType = "full" | "incremental";
export type TargetLayer = "staging" | "l0_raw" | "l1_clean" | "l2_mart";
export type TriggerType = "manual" | "scheduled" | "api";
export type JobRunStatus = "pending" | "queued" | "running" | "success" | "failed" | "cancelled";
export type JobRunStepStatus = "pending" | "running" | "success" | "failed" | "cancelled";
export type AlertConditionType =
  | "run_failed"
  | "runtime_exceeded"
  | "records_below_threshold"
  | "pipeline_not_run_on_schedule"
  | "step_failed";
export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type AlertStatus = "open" | "acknowledged" | "resolved";
export type HeartbeatStatus = "starting" | "idle" | "running" | "error" | "stopped";

export interface AuthUser {
  id: number;
  email: string;
  display_name: string;
  role: UserRole;
  external_subject: string | null;
  created_at: string;
}

export interface DashboardSummary {
  datasets_count: number;
  pipelines_count: number;
  active_pipelines_count: number;
  runs_count: number;
  open_alerts_count: number;
  runs_by_status: Record<string, number>;
}

export interface Dataset {
  id: number;
  name: string;
  description: string | null;
  owner: string | null;
  source_type: DatasetSourceType;
  schema_version: string | null;
  created_at: string;
  updated_at: string;
}

export type DatasetInput = Pick<
  Dataset,
  "name" | "description" | "owner" | "source_type" | "schema_version"
>;
export type DatasetUpdate = Partial<DatasetInput>;

export interface Pipeline {
  id: number;
  dataset_id: number;
  name: string;
  description: string | null;
  schedule: string | null;
  active: boolean;
  engine: PipelineEngine;
  processing_mode: ProcessingMode;
  load_type: LoadType;
  target_layer: TargetLayer;
  created_at: string;
  updated_at: string;
}

export type PipelineInput = Pick<
  Pipeline,
  | "dataset_id"
  | "name"
  | "description"
  | "schedule"
  | "active"
  | "engine"
  | "processing_mode"
  | "load_type"
  | "target_layer"
>;
export type PipelineUpdate = Partial<PipelineInput>;

export interface PipelineVersion {
  id: number;
  pipeline_id: number;
  version_number: number;
  config_json: Record<string, unknown>;
  active: boolean;
  created_at: string;
  created_by: number | null;
}

export interface PipelineVersionInput {
  version_number: number;
  config_json: Record<string, unknown>;
  active: boolean;
  created_by?: number | null;
}

export interface JobRun {
  id: number;
  pipeline_id: number;
  pipeline_version_id: number | null;
  trigger_type: TriggerType;
  status: JobRunStatus;
  started_at: string | null;
  finished_at: string | null;
  runtime_seconds: number | null;
  records_processed: number | null;
  error_message: string | null;
  created_by: number | null;
  created_at: string;
}

export interface JobRunStep {
  id?: number;
  run_id: number;
  name: "extract" | "transform" | "load";
  status: JobRunStepStatus;
  started_at: string | null;
  finished_at: string | null;
  records_processed: number | null;
  error_message: string | null;
  order_index: number;
}

export interface JobRunCreateInput {
  trigger_type: TriggerType;
}

export interface JobRunUpdate {
  status?: JobRunStatus;
  started_at?: string | null;
  finished_at?: string | null;
  runtime_seconds?: number | null;
  records_processed?: number | null;
  error_message?: string | null;
}

export interface AlertRule {
  id: number;
  pipeline_id: number;
  name: string;
  condition_type: AlertConditionType;
  threshold_seconds: number | null;
  threshold_records: number | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type AlertRuleInput = Pick<
  AlertRule,
  "pipeline_id" | "name" | "condition_type" | "threshold_seconds" | "threshold_records" | "enabled"
>;
export type AlertRuleUpdate = Partial<AlertRuleInput>;

export interface AlertEvent {
  id: number;
  rule_id: number;
  run_id: number | null;
  pipeline_id: number | null;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  created_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  acknowledged_by: number | null;
  resolved_by: number | null;
}

export interface AuditLog {
  id: number;
  actor_user_id: number | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
}

export interface WorkerHeartbeat {
  worker_id: string;
  status: HeartbeatStatus;
  last_seen_at: string;
  processed_jobs: number;
  current_run_id: number | null;
}

export interface SchedulerHeartbeat {
  scheduler_id: string;
  status: HeartbeatStatus;
  last_tick_at: string;
  created_runs_count: number;
}

export interface SystemStatus {
  database: string;
  workers: WorkerHeartbeat[];
  scheduler: SchedulerHeartbeat | null;
}

export interface NavigationItem {
  label: string;
  path: string;
  description: string;
}
