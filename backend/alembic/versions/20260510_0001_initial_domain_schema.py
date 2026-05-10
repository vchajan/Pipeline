"""initial domain schema

Revision ID: 20260510_0001
Revises:
Create Date: 2026-05-10
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "20260510_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


user_role = sa.Enum(
    "admin",
    "operator",
    "viewer",
    name="user_role",
    native_enum=False,
    create_constraint=True,
)
dataset_source_type = sa.Enum(
    "oltp_database",
    "csv_file",
    "api",
    "event_stream",
    "data_lake",
    name="dataset_source_type",
    native_enum=False,
    create_constraint=True,
)
pipeline_engine = sa.Enum(
    "python",
    "sql",
    "spark",
    "databricks",
    "aws_glue",
    name="pipeline_engine",
    native_enum=False,
    create_constraint=True,
)
processing_mode = sa.Enum(
    "batch",
    "streaming",
    "lambda",
    "kappa",
    name="processing_mode",
    native_enum=False,
    create_constraint=True,
)
load_type = sa.Enum(
    "full",
    "incremental",
    name="load_type",
    native_enum=False,
    create_constraint=True,
)
target_layer = sa.Enum(
    "staging",
    "l0_raw",
    "l1_clean",
    "l2_mart",
    name="target_layer",
    native_enum=False,
    create_constraint=True,
)
trigger_type = sa.Enum(
    "manual",
    "scheduled",
    "api",
    name="trigger_type",
    native_enum=False,
    create_constraint=True,
)
job_run_status = sa.Enum(
    "pending",
    "queued",
    "running",
    "success",
    "failed",
    "cancelled",
    name="job_run_status",
    native_enum=False,
    create_constraint=True,
)
job_run_step_status = sa.Enum(
    "pending",
    "running",
    "success",
    "failed",
    "cancelled",
    name="job_run_step_status",
    native_enum=False,
    create_constraint=True,
)
alert_condition_type = sa.Enum(
    "run_failed",
    "runtime_exceeded",
    "records_below_threshold",
    "pipeline_not_run_on_schedule",
    "step_failed",
    name="alert_condition_type",
    native_enum=False,
    create_constraint=True,
)
alert_severity = sa.Enum(
    "low",
    "medium",
    "high",
    "critical",
    name="alert_severity",
    native_enum=False,
    create_constraint=True,
)
alert_status = sa.Enum(
    "open",
    "acknowledged",
    "resolved",
    name="alert_status",
    native_enum=False,
    create_constraint=True,
)
heartbeat_status = sa.Enum(
    "starting",
    "idle",
    "running",
    "error",
    "stopped",
    name="heartbeat_status",
    native_enum=False,
    create_constraint=True,
)


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column("role", user_role, server_default="viewer", nullable=False),
        sa.Column("external_subject", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("external_subject"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=False)
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)

    op.create_table(
        "datasets",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("owner", sa.String(length=255), nullable=True),
        sa.Column("source_type", dataset_source_type, nullable=False),
        sa.Column("schema_version", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index(op.f("ix_datasets_id"), "datasets", ["id"], unique=False)
    op.create_index(op.f("ix_datasets_name"), "datasets", ["name"], unique=False)

    op.create_table(
        "pipelines",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("dataset_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("schedule", sa.String(length=100), nullable=True),
        sa.Column("active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("engine", pipeline_engine, server_default="python", nullable=False),
        sa.Column("processing_mode", processing_mode, server_default="batch", nullable=False),
        sa.Column("load_type", load_type, server_default="full", nullable=False),
        sa.Column("target_layer", target_layer, server_default="staging", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["dataset_id"], ["datasets.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("dataset_id", "name", name="uq_pipelines_dataset_id_name"),
    )
    op.create_index(op.f("ix_pipelines_dataset_id"), "pipelines", ["dataset_id"], unique=False)
    op.create_index(op.f("ix_pipelines_id"), "pipelines", ["id"], unique=False)
    op.create_index(op.f("ix_pipelines_name"), "pipelines", ["name"], unique=False)

    op.create_table(
        "pipeline_versions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("pipeline_id", sa.Integer(), nullable=False),
        sa.Column("version_number", sa.Integer(), nullable=False),
        sa.Column("config_json", sa.JSON(), nullable=False),
        sa.Column("active", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["pipeline_id"], ["pipelines.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("pipeline_id", "version_number", name="uq_pipeline_versions_pipeline_id_version_number"),
    )
    op.create_index(op.f("ix_pipeline_versions_id"), "pipeline_versions", ["id"], unique=False)
    op.create_index(op.f("ix_pipeline_versions_pipeline_id"), "pipeline_versions", ["pipeline_id"], unique=False)
    op.create_index(
        "uq_pipeline_versions_one_active_per_pipeline",
        "pipeline_versions",
        ["pipeline_id"],
        unique=True,
        postgresql_where=sa.text("active = true"),
        sqlite_where=sa.text("active = 1"),
    )

    op.create_table(
        "job_runs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("pipeline_id", sa.Integer(), nullable=False),
        sa.Column("pipeline_version_id", sa.Integer(), nullable=True),
        sa.Column("trigger_type", trigger_type, nullable=False),
        sa.Column("status", job_run_status, server_default="pending", nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("runtime_seconds", sa.Integer(), nullable=True),
        sa.Column("records_processed", sa.Integer(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["pipeline_id"], ["pipelines.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["pipeline_version_id"], ["pipeline_versions.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_job_runs_id"), "job_runs", ["id"], unique=False)
    op.create_index(op.f("ix_job_runs_pipeline_id"), "job_runs", ["pipeline_id"], unique=False)
    op.create_index(op.f("ix_job_runs_pipeline_version_id"), "job_runs", ["pipeline_version_id"], unique=False)
    op.create_index(op.f("ix_job_runs_status"), "job_runs", ["status"], unique=False)

    op.create_table(
        "job_run_steps",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("run_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("status", job_run_step_status, server_default="pending", nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("records_processed", sa.Integer(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["run_id"], ["job_runs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("run_id", "order_index", name="uq_job_run_steps_run_id_order_index"),
    )
    op.create_index(op.f("ix_job_run_steps_id"), "job_run_steps", ["id"], unique=False)
    op.create_index(op.f("ix_job_run_steps_run_id"), "job_run_steps", ["run_id"], unique=False)
    op.create_index(op.f("ix_job_run_steps_status"), "job_run_steps", ["status"], unique=False)

    op.create_table(
        "alert_rules",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("pipeline_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("condition_type", alert_condition_type, nullable=False),
        sa.Column("threshold_seconds", sa.Integer(), nullable=True),
        sa.Column("threshold_records", sa.Integer(), nullable=True),
        sa.Column("enabled", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["pipeline_id"], ["pipelines.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("pipeline_id", "name", name="uq_alert_rules_pipeline_id_name"),
    )
    op.create_index(op.f("ix_alert_rules_id"), "alert_rules", ["id"], unique=False)
    op.create_index(op.f("ix_alert_rules_pipeline_id"), "alert_rules", ["pipeline_id"], unique=False)

    op.create_table(
        "alert_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("rule_id", sa.Integer(), nullable=False),
        sa.Column("run_id", sa.Integer(), nullable=True),
        sa.Column("pipeline_id", sa.Integer(), nullable=True),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("severity", alert_severity, server_default="medium", nullable=False),
        sa.Column("status", alert_status, server_default="open", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("acknowledged_by", sa.Integer(), nullable=True),
        sa.Column("resolved_by", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["acknowledged_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["pipeline_id"], ["pipelines.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["resolved_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["rule_id"], ["alert_rules.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["run_id"], ["job_runs.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_alert_events_id"), "alert_events", ["id"], unique=False)
    op.create_index(op.f("ix_alert_events_pipeline_id"), "alert_events", ["pipeline_id"], unique=False)
    op.create_index(op.f("ix_alert_events_rule_id"), "alert_events", ["rule_id"], unique=False)
    op.create_index(op.f("ix_alert_events_status"), "alert_events", ["status"], unique=False)

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("actor_user_id", sa.Integer(), nullable=True),
        sa.Column("actor_email", sa.String(length=255), nullable=True),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("entity_type", sa.String(length=100), nullable=False),
        sa.Column("entity_id", sa.String(length=100), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_audit_logs_action"), "audit_logs", ["action"], unique=False)
    op.create_index(op.f("ix_audit_logs_actor_email"), "audit_logs", ["actor_email"], unique=False)
    op.create_index(op.f("ix_audit_logs_entity_id"), "audit_logs", ["entity_id"], unique=False)
    op.create_index(op.f("ix_audit_logs_entity_type"), "audit_logs", ["entity_type"], unique=False)
    op.create_index(op.f("ix_audit_logs_id"), "audit_logs", ["id"], unique=False)

    op.create_table(
        "outbox_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(length=100), nullable=False),
        sa.Column("aggregate_type", sa.String(length=100), nullable=False),
        sa.Column("aggregate_id", sa.String(length=100), nullable=False),
        sa.Column("payload_json", sa.JSON(), nullable=False),
        sa.Column("processed", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_outbox_events_aggregate_id"), "outbox_events", ["aggregate_id"], unique=False)
    op.create_index(op.f("ix_outbox_events_aggregate_type"), "outbox_events", ["aggregate_type"], unique=False)
    op.create_index(op.f("ix_outbox_events_event_type"), "outbox_events", ["event_type"], unique=False)
    op.create_index(op.f("ix_outbox_events_id"), "outbox_events", ["id"], unique=False)
    op.create_index(op.f("ix_outbox_events_processed"), "outbox_events", ["processed"], unique=False)

    op.create_table(
        "worker_heartbeats",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("worker_id", sa.String(length=100), nullable=False),
        sa.Column("status", heartbeat_status, server_default="starting", nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("processed_jobs", sa.Integer(), server_default="0", nullable=False),
        sa.Column("current_run_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["current_run_id"], ["job_runs.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("worker_id"),
    )
    op.create_index(op.f("ix_worker_heartbeats_id"), "worker_heartbeats", ["id"], unique=False)
    op.create_index(op.f("ix_worker_heartbeats_status"), "worker_heartbeats", ["status"], unique=False)

    op.create_table(
        "scheduler_heartbeats",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("scheduler_id", sa.String(length=100), nullable=False),
        sa.Column("last_tick_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("status", heartbeat_status, server_default="starting", nullable=False),
        sa.Column("created_runs_count", sa.Integer(), server_default="0", nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("scheduler_id"),
    )
    op.create_index(op.f("ix_scheduler_heartbeats_id"), "scheduler_heartbeats", ["id"], unique=False)
    op.create_index(op.f("ix_scheduler_heartbeats_status"), "scheduler_heartbeats", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_scheduler_heartbeats_status"), table_name="scheduler_heartbeats")
    op.drop_index(op.f("ix_scheduler_heartbeats_id"), table_name="scheduler_heartbeats")
    op.drop_table("scheduler_heartbeats")
    op.drop_index(op.f("ix_worker_heartbeats_status"), table_name="worker_heartbeats")
    op.drop_index(op.f("ix_worker_heartbeats_id"), table_name="worker_heartbeats")
    op.drop_table("worker_heartbeats")
    op.drop_index(op.f("ix_outbox_events_processed"), table_name="outbox_events")
    op.drop_index(op.f("ix_outbox_events_id"), table_name="outbox_events")
    op.drop_index(op.f("ix_outbox_events_event_type"), table_name="outbox_events")
    op.drop_index(op.f("ix_outbox_events_aggregate_type"), table_name="outbox_events")
    op.drop_index(op.f("ix_outbox_events_aggregate_id"), table_name="outbox_events")
    op.drop_table("outbox_events")
    op.drop_index(op.f("ix_audit_logs_id"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_entity_type"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_entity_id"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_actor_email"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_action"), table_name="audit_logs")
    op.drop_table("audit_logs")
    op.drop_index(op.f("ix_alert_events_status"), table_name="alert_events")
    op.drop_index(op.f("ix_alert_events_rule_id"), table_name="alert_events")
    op.drop_index(op.f("ix_alert_events_pipeline_id"), table_name="alert_events")
    op.drop_index(op.f("ix_alert_events_id"), table_name="alert_events")
    op.drop_table("alert_events")
    op.drop_index(op.f("ix_alert_rules_pipeline_id"), table_name="alert_rules")
    op.drop_index(op.f("ix_alert_rules_id"), table_name="alert_rules")
    op.drop_table("alert_rules")
    op.drop_index(op.f("ix_job_run_steps_status"), table_name="job_run_steps")
    op.drop_index(op.f("ix_job_run_steps_run_id"), table_name="job_run_steps")
    op.drop_index(op.f("ix_job_run_steps_id"), table_name="job_run_steps")
    op.drop_table("job_run_steps")
    op.drop_index(op.f("ix_job_runs_status"), table_name="job_runs")
    op.drop_index(op.f("ix_job_runs_pipeline_version_id"), table_name="job_runs")
    op.drop_index(op.f("ix_job_runs_pipeline_id"), table_name="job_runs")
    op.drop_index(op.f("ix_job_runs_id"), table_name="job_runs")
    op.drop_table("job_runs")
    op.drop_index("uq_pipeline_versions_one_active_per_pipeline", table_name="pipeline_versions")
    op.drop_index(op.f("ix_pipeline_versions_pipeline_id"), table_name="pipeline_versions")
    op.drop_index(op.f("ix_pipeline_versions_id"), table_name="pipeline_versions")
    op.drop_table("pipeline_versions")
    op.drop_index(op.f("ix_pipelines_name"), table_name="pipelines")
    op.drop_index(op.f("ix_pipelines_id"), table_name="pipelines")
    op.drop_index(op.f("ix_pipelines_dataset_id"), table_name="pipelines")
    op.drop_table("pipelines")
    op.drop_index(op.f("ix_datasets_name"), table_name="datasets")
    op.drop_index(op.f("ix_datasets_id"), table_name="datasets")
    op.drop_table("datasets")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
