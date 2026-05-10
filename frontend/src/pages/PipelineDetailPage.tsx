import { Play, Save } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  useCurrentUser,
  useDatasets,
  usePipeline,
  usePipelineAlerts,
  usePipelineRuns,
  useRunPipeline,
  useUpdatePipeline,
} from "../api/queries";
import { canManageDefinitions, canOperateRuns } from "../auth/permissions";
import { DataTable } from "../components/DataTable";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { EmptyState, ErrorState, LoadingState } from "../components/StateBlock";
import { StatusBadge } from "../components/StatusBadge";
import type { AlertEvent, JobRun, PipelineInput } from "../types/domain";
import {
  formatDate,
  formatNumber,
  getMutationMessage,
  label,
  loadTypes,
  pipelineEngines,
  processingModes,
  targetLayers,
} from "./pageUtils";

const emptyForm: PipelineInput = {
  dataset_id: 0,
  name: "",
  description: "",
  schedule: "",
  active: true,
  engine: "python",
  processing_mode: "batch",
  load_type: "full",
  target_layer: "staging",
};

export function PipelineDetailPage() {
  const pipelineId = Number(useParams().pipelineId);
  const { data: user } = useCurrentUser();
  const pipelineQuery = usePipeline(Number.isFinite(pipelineId) ? pipelineId : undefined);
  const datasetsQuery = useDatasets();
  const runsQuery = usePipelineRuns(Number.isFinite(pipelineId) ? pipelineId : undefined);
  const alertsQuery = usePipelineAlerts(Number.isFinite(pipelineId) ? pipelineId : undefined);
  const updatePipeline = useUpdatePipeline(pipelineId);
  const runPipeline = useRunPipeline(pipelineId);
  const [form, setForm] = useState<PipelineInput>(emptyForm);
  const canManage = canManageDefinitions(user?.role);
  const canRun = canOperateRuns(user?.role);

  useEffect(() => {
    if (pipelineQuery.data) {
      setForm({
        dataset_id: pipelineQuery.data.dataset_id,
        name: pipelineQuery.data.name,
        description: pipelineQuery.data.description ?? "",
        schedule: pipelineQuery.data.schedule ?? "",
        active: pipelineQuery.data.active,
        engine: pipelineQuery.data.engine,
        processing_mode: pipelineQuery.data.processing_mode,
        load_type: pipelineQuery.data.load_type,
        target_layer: pipelineQuery.data.target_layer,
      });
    }
  }, [pipelineQuery.data]);

  function updateField<Key extends keyof PipelineInput>(key: Key, value: PipelineInput[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updatePipeline.mutate({
      ...form,
      description: optionalText(form.description),
      schedule: optionalText(form.schedule),
    });
  }

  if (!Number.isFinite(pipelineId)) {
    return <EmptyState title="Pipeline not found" message="The route did not include a valid pipeline id." />;
  }

  const pipeline = pipelineQuery.data;
  const datasetName =
    pipeline && datasetsQuery.data?.find((dataset) => dataset.id === pipeline.dataset_id)?.name;

  return (
    <section className="page">
      <PageHeader
        eyebrow="Definitions"
        title={pipeline?.name ?? "Pipeline detail"}
        description="Pipeline configuration, recent runs and alert activity."
        actions={
          <div className="inline-actions">
            <Link className="secondary-button" to={`/pipelines/${pipelineId}/versions`}>
              Versions
            </Link>
            <button
              className="primary-button"
              type="button"
              disabled={!canRun || !pipeline?.active || runPipeline.isPending}
              onClick={() => runPipeline.mutate({ trigger_type: "manual" })}
            >
              <Play aria-hidden="true" />
              Run pipeline
            </button>
          </div>
        }
      />

      {pipelineQuery.isLoading ? <LoadingState title="Loading pipeline" /> : null}
      {pipelineQuery.isError ? (
        <ErrorState title="Pipeline unavailable" message="The pipeline detail request failed." />
      ) : null}

      {pipeline ? (
        <>
          <SectionCard title="Profile" description="Current pipeline definition.">
            <dl className="detail-grid">
              <Detail label="Dataset" value={datasetName ?? `Dataset #${pipeline.dataset_id}`} />
              <Detail label="Active" value={<StatusBadge value={pipeline.active} />} />
              <Detail label="Schedule" value={pipeline.schedule ?? "Manual"} />
              <Detail label="Engine" value={label(pipeline.engine)} />
              <Detail label="Processing mode" value={label(pipeline.processing_mode)} />
              <Detail label="Load type" value={label(pipeline.load_type)} />
              <Detail label="Target layer" value={label(pipeline.target_layer)} />
              <Detail label="Updated" value={formatDate(pipeline.updated_at)} />
            </dl>
            {runPipeline.isError ? (
              <p className="form-message form-message--error">{getMutationMessage(runPipeline.error)}</p>
            ) : null}
            {!canRun ? <p className="muted">Operator role required to start runs.</p> : null}
          </SectionCard>

          <SectionCard title="Edit Pipeline" description="Admin-only definition changes.">
            <form className="form-grid" onSubmit={handleSubmit}>
              <label className="field">
                <span>Dataset</span>
                <select
                  value={form.dataset_id}
                  disabled={!canManage || updatePipeline.isPending}
                  onChange={(event) => updateField("dataset_id", Number(event.target.value))}
                >
                  {(datasetsQuery.data ?? []).map((dataset) => (
                    <option key={dataset.id} value={dataset.id}>
                      {dataset.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Name</span>
                <input
                  required
                  value={form.name}
                  disabled={!canManage || updatePipeline.isPending}
                  onChange={(event) => updateField("name", event.target.value)}
                />
              </label>
              <label className="field">
                <span>Engine</span>
                <select
                  value={form.engine}
                  disabled={!canManage || updatePipeline.isPending}
                  onChange={(event) => updateField("engine", event.target.value as PipelineInput["engine"])}
                >
                  {pipelineEngines.map((engine) => (
                    <option key={engine} value={engine}>
                      {label(engine)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Processing mode</span>
                <select
                  value={form.processing_mode}
                  disabled={!canManage || updatePipeline.isPending}
                  onChange={(event) =>
                    updateField("processing_mode", event.target.value as PipelineInput["processing_mode"])
                  }
                >
                  {processingModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {label(mode)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Load type</span>
                <select
                  value={form.load_type}
                  disabled={!canManage || updatePipeline.isPending}
                  onChange={(event) => updateField("load_type", event.target.value as PipelineInput["load_type"])}
                >
                  {loadTypes.map((loadType) => (
                    <option key={loadType} value={loadType}>
                      {label(loadType)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Target layer</span>
                <select
                  value={form.target_layer}
                  disabled={!canManage || updatePipeline.isPending}
                  onChange={(event) =>
                    updateField("target_layer", event.target.value as PipelineInput["target_layer"])
                  }
                >
                  {targetLayers.map((targetLayer) => (
                    <option key={targetLayer} value={targetLayer}>
                      {label(targetLayer)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Schedule</span>
                <input
                  value={form.schedule ?? ""}
                  disabled={!canManage || updatePipeline.isPending}
                  onChange={(event) => updateField("schedule", event.target.value)}
                />
              </label>
              <label className="field field--checkbox">
                <input
                  type="checkbox"
                  checked={form.active}
                  disabled={!canManage || updatePipeline.isPending}
                  onChange={(event) => updateField("active", event.target.checked)}
                />
                <span>Active</span>
              </label>
              <label className="field field--wide">
                <span>Description</span>
                <textarea
                  rows={3}
                  value={form.description ?? ""}
                  disabled={!canManage || updatePipeline.isPending}
                  onChange={(event) => updateField("description", event.target.value)}
                />
              </label>
              <div className="form-actions">
                <button className="primary-button" type="submit" disabled={!canManage || updatePipeline.isPending}>
                  <Save aria-hidden="true" />
                  Save changes
                </button>
                {!canManage ? <span className="muted">Admin role required.</span> : null}
                {updatePipeline.isError ? (
                  <span className="form-message form-message--error">{getMutationMessage(updatePipeline.error)}</span>
                ) : null}
                {updatePipeline.isSuccess ? <span className="form-message">Pipeline updated.</span> : null}
              </div>
            </form>
          </SectionCard>

          <div className="panel-grid panel-grid--two">
            <SectionCard title="Recent Runs" description="Runs for this pipeline.">
              {runsQuery.isLoading ? <LoadingState title="Loading runs" /> : null}
              {runsQuery.isError ? <ErrorState title="Runs unavailable" message="The runs request failed." /> : null}
              {runsQuery.data ? (
                <DataTable<JobRun>
                  rows={runsQuery.data}
                  getRowKey={(run) => run.id}
                  emptyTitle="No runs"
                  emptyMessage="Start the pipeline to create its first JobRun."
                  columns={[
                    { header: "Run", render: (run) => <Link to={`/runs/${run.id}`}>#{run.id}</Link> },
                    { header: "Status", render: (run) => <StatusBadge value={run.status} /> },
                    { header: "Runtime", render: (run) => `${formatNumber(run.runtime_seconds)} sec` },
                    { header: "Created", render: (run) => formatDate(run.created_at) },
                  ]}
                />
              ) : null}
            </SectionCard>

            <SectionCard title="Alerts" description="Alerts emitted for this pipeline.">
              {alertsQuery.isLoading ? <LoadingState title="Loading alerts" /> : null}
              {alertsQuery.isError ? (
                <ErrorState title="Alerts unavailable" message="The alerts request failed." />
              ) : null}
              {alertsQuery.data ? (
                <DataTable<AlertEvent>
                  rows={alertsQuery.data}
                  getRowKey={(alert) => alert.id}
                  emptyTitle="No alerts"
                  emptyMessage="No alert rule has fired for this pipeline."
                  columns={[
                    { header: "Alert", render: (alert) => <Link to={`/alerts/${alert.id}`}>#{alert.id}</Link> },
                    { header: "Severity", render: (alert) => <StatusBadge value={alert.severity} /> },
                    { header: "Status", render: (alert) => <StatusBadge value={alert.status} /> },
                    { header: "Created", render: (alert) => formatDate(alert.created_at) },
                  ]}
                />
              ) : null}
            </SectionCard>
          </div>
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

function optionalText(value: string | null): string | null {
  return value && value.trim() ? value.trim() : null;
}
