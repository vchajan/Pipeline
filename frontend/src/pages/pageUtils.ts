import type {
  AlertConditionType,
  AlertSeverity,
  AlertStatus,
  DatasetSourceType,
  JobRun,
  JobRunStep,
  JobRunStatus,
  LoadType,
  PipelineEngine,
  ProcessingMode,
  TargetLayer,
  TriggerType,
} from "../types/domain";

export const datasetSourceTypes: DatasetSourceType[] = [
  "oltp_database",
  "csv_file",
  "api",
  "event_stream",
  "data_lake",
];

export const pipelineEngines: PipelineEngine[] = ["python", "sql", "spark", "databricks", "aws_glue"];
export const processingModes: ProcessingMode[] = ["batch", "streaming", "lambda", "kappa"];
export const loadTypes: LoadType[] = ["full", "incremental"];
export const targetLayers: TargetLayer[] = ["staging", "l0_raw", "l1_clean", "l2_mart"];
export const triggerTypes: TriggerType[] = ["manual", "scheduled", "api"];
export const runStatuses: JobRunStatus[] = [
  "pending",
  "queued",
  "running",
  "success",
  "failed",
  "cancelled",
];
export const alertConditionTypes: AlertConditionType[] = [
  "run_failed",
  "runtime_exceeded",
  "records_below_threshold",
  "pipeline_not_run_on_schedule",
  "step_failed",
];
export const alertStatuses: AlertStatus[] = ["open", "acknowledged", "resolved"];
export const alertSeverities: AlertSeverity[] = ["low", "medium", "high", "critical"];

export function label(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return String(value).replace(/_/g, " ");
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "Not set";
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "Not set";
  }
  return new Intl.NumberFormat().format(value);
}

export function parseOptionalNumber(value: string): number | null {
  return value.trim() === "" ? null : Number(value);
}

export function parseJsonConfig(value: string): Record<string, unknown> {
  if (value.trim() === "") {
    return {};
  }
  const parsed = JSON.parse(value) as unknown;
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error("Configuration JSON must be an object.");
  }
  return parsed as Record<string, unknown>;
}

export function getMutationMessage(error: unknown): string {
  return error instanceof Error ? error.message : "The request failed.";
}

export function inferRunSteps(run: JobRun): JobRunStep[] {
  const stepStatus =
    run.status === "success"
      ? "success"
      : run.status === "failed"
        ? "failed"
        : run.status === "cancelled"
          ? "cancelled"
          : run.status === "running"
            ? "running"
            : "pending";

  return ["extract", "transform", "load"].map((name, index) => ({
    run_id: run.id,
    name: name as JobRunStep["name"],
    order_index: index + 1,
    status: stepStatus,
    started_at: run.started_at,
    finished_at: run.finished_at,
    records_processed: run.records_processed,
    error_message: run.status === "failed" && index === 2 ? run.error_message : null,
  }));
}
