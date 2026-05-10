from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    OPERATOR = "operator"
    VIEWER = "viewer"


class DatasetSourceType(str, Enum):
    OLTP_DATABASE = "oltp_database"
    CSV_FILE = "csv_file"
    API = "api"
    EVENT_STREAM = "event_stream"
    DATA_LAKE = "data_lake"


class PipelineEngine(str, Enum):
    PYTHON = "python"
    SQL = "sql"
    SPARK = "spark"
    DATABRICKS = "databricks"
    AWS_GLUE = "aws_glue"


class ProcessingMode(str, Enum):
    BATCH = "batch"
    STREAMING = "streaming"
    LAMBDA = "lambda"
    KAPPA = "kappa"


class LoadType(str, Enum):
    FULL = "full"
    INCREMENTAL = "incremental"


class TargetLayer(str, Enum):
    STAGING = "staging"
    L0_RAW = "l0_raw"
    L1_CLEAN = "l1_clean"
    L2_MART = "l2_mart"


class TriggerType(str, Enum):
    MANUAL = "manual"
    SCHEDULED = "scheduled"
    API = "api"


class JobRunStatus(str, Enum):
    PENDING = "pending"
    QUEUED = "queued"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"


class JobRunStepStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"


class AlertConditionType(str, Enum):
    RUN_FAILED = "run_failed"
    RUNTIME_EXCEEDED = "runtime_exceeded"
    RECORDS_BELOW_THRESHOLD = "records_below_threshold"
    PIPELINE_NOT_RUN_ON_SCHEDULE = "pipeline_not_run_on_schedule"
    STEP_FAILED = "step_failed"


class AlertSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertStatus(str, Enum):
    OPEN = "open"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"


class HeartbeatStatus(str, Enum):
    STARTING = "starting"
    IDLE = "idle"
    RUNNING = "running"
    ERROR = "error"
    STOPPED = "stopped"
