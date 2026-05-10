import { Ban } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  useCancelRun,
  useCurrentUser,
  usePipeline,
  usePipelineVersions,
  useRun,
  useUpdateRun,
} from "../api/queries";
import { canOperateRuns } from "../auth/permissions";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { EmptyState, ErrorState, LoadingState } from "../components/StateBlock";
import { StatusBadge } from "../components/StatusBadge";
import type { JobRunStatus } from "../types/domain";
import {
  formatDate,
  formatNumber,
  getMutationMessage,
  inferRunSteps,
  label,
  parseOptionalNumber,
  runStatuses,
} from "./pageUtils";

export function RunDetailPage() {
  const runId = Number(useParams().runId);
  const { data: user } = useCurrentUser();
  const runQuery = useRun(Number.isFinite(runId) ? runId : undefined);
  const pipelineQuery = usePipeline(runQuery.data?.pipeline_id);
  const versionsQuery = usePipelineVersions(runQuery.data?.pipeline_id);
  const updateRun = useUpdateRun(runId);
  const cancelRun = useCancelRun(runId);
  const [status, setStatus] = useState<JobRunStatus>("queued");
  const [runtimeSeconds, setRuntimeSeconds] = useState("");
  const [recordsProcessed, setRecordsProcessed] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const canOperate = canOperateRuns(user?.role);

  useEffect(() => {
    if (runQuery.data) {
      setStatus(runQuery.data.status);
      setRuntimeSeconds(runQuery.data.runtime_seconds?.toString() ?? "");
      setRecordsProcessed(runQuery.data.records_processed?.toString() ?? "");
      setErrorMessage(runQuery.data.error_message ?? "");
    }
  }, [runQuery.data]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateRun.mutate({
      status,
      runtime_seconds: parseOptionalNumber(runtimeSeconds),
      records_processed: parseOptionalNumber(recordsProcessed),
      error_message: errorMessage.trim() || null,
    });
  }

  if (!Number.isFinite(runId)) {
    return <EmptyState title="Run not found" message="The route did not include a valid run id." />;
  }

  const run = runQuery.data;
  const version = versionsQuery.data?.find((item) => item.id === run?.pipeline_version_id);
  const canCancel = run?.status === "queued" || run?.status === "running";

  return (
    <section className="page">
      <PageHeader
        eyebrow="Execution"
        title={run ? `Run #${run.id}` : "Run detail"}
        description="ETL steps, timeline and run diagnostics."
        actions={
          <button
            className="danger-button"
            type="button"
            disabled={!canOperate || !canCancel || cancelRun.isPending}
            onClick={() => cancelRun.mutate()}
          >
            <Ban aria-hidden="true" />
            Cancel run
          </button>
        }
      />

      {runQuery.isLoading ? <LoadingState title="Loading run" /> : null}
      {runQuery.isError ? <ErrorState title="Run unavailable" message="The run detail request failed." /> : null}

      {run ? (
        <>
          <SectionCard title="Run Summary" description="Current execution state and metrics.">
            <dl className="detail-grid">
              <Detail label="Status" value={<StatusBadge value={run.status} />} />
              <Detail
                label="Pipeline"
                value={
                  pipelineQuery.data ? (
                    <Link to={`/pipelines/${pipelineQuery.data.id}`}>{pipelineQuery.data.name}</Link>
                  ) : (
                    `Pipeline #${run.pipeline_id}`
                  )
                }
              />
              <Detail label="Version" value={version ? `v${version.version_number}` : "Not set"} />
              <Detail label="Trigger" value={label(run.trigger_type)} />
              <Detail label="Runtime" value={`${formatNumber(run.runtime_seconds)} sec`} />
              <Detail label="Records" value={formatNumber(run.records_processed)} />
              <Detail label="Created" value={formatDate(run.created_at)} />
              <Detail label="Started" value={formatDate(run.started_at)} />
              <Detail label="Finished" value={formatDate(run.finished_at)} />
            </dl>
            {run.error_message ? <p className="form-message form-message--error">{run.error_message}</p> : null}
            {cancelRun.isError ? (
              <p className="form-message form-message--error">{getMutationMessage(cancelRun.error)}</p>
            ) : null}
            {!canOperate ? <p className="muted">Operator role required to update or cancel runs.</p> : null}
          </SectionCard>

          <div className="panel-grid panel-grid--two">
            <SectionCard title="ETL Steps" description="Extract, transform and load execution view.">
              <div className="step-list">
                {inferRunSteps(run).map((step) => (
                  <article className="step-item" key={step.name}>
                    <span>{step.order_index}</span>
                    <div>
                      <strong>{label(step.name)}</strong>
                      <p>{step.error_message ?? `${formatNumber(step.records_processed)} records`}</p>
                    </div>
                    <StatusBadge value={step.status} />
                  </article>
                ))}
              </div>
              <p className="muted">Step detail is inferred until a dedicated run-step API is exposed.</p>
            </SectionCard>

            <SectionCard title="Timeline" description="Important lifecycle timestamps.">
              <ol className="timeline">
                <li>
                  <span>Created</span>
                  <strong>{formatDate(run.created_at)}</strong>
                </li>
                <li>
                  <span>Started</span>
                  <strong>{formatDate(run.started_at)}</strong>
                </li>
                <li>
                  <span>Finished</span>
                  <strong>{formatDate(run.finished_at)}</strong>
                </li>
              </ol>
            </SectionCard>
          </div>

          <SectionCard title="Update Run" description="Operator override for simulated execution metadata.">
            <form className="form-grid" onSubmit={handleSubmit}>
              <label className="field">
                <span>Status</span>
                <select
                  value={status}
                  disabled={!canOperate || updateRun.isPending}
                  onChange={(event) => setStatus(event.target.value as JobRunStatus)}
                >
                  {runStatuses.map((item) => (
                    <option key={item} value={item}>
                      {label(item)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Runtime seconds</span>
                <input
                  min={0}
                  type="number"
                  value={runtimeSeconds}
                  disabled={!canOperate || updateRun.isPending}
                  onChange={(event) => setRuntimeSeconds(event.target.value)}
                />
              </label>
              <label className="field">
                <span>Records processed</span>
                <input
                  min={0}
                  type="number"
                  value={recordsProcessed}
                  disabled={!canOperate || updateRun.isPending}
                  onChange={(event) => setRecordsProcessed(event.target.value)}
                />
              </label>
              <label className="field field--wide">
                <span>Error message</span>
                <textarea
                  rows={3}
                  value={errorMessage}
                  disabled={!canOperate || updateRun.isPending}
                  onChange={(event) => setErrorMessage(event.target.value)}
                />
              </label>
              <div className="form-actions">
                <button className="primary-button" type="submit" disabled={!canOperate || updateRun.isPending}>
                  Save run
                </button>
                {updateRun.isError ? (
                  <span className="form-message form-message--error">{getMutationMessage(updateRun.error)}</span>
                ) : null}
                {updateRun.isSuccess ? <span className="form-message">Run updated.</span> : null}
              </div>
            </form>
          </SectionCard>
        </>
      ) : null}
    </section>
  );
}

function Detail({ label: detailLabel, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt>{detailLabel}</dt>
      <dd>{value}</dd>
    </div>
  );
}
