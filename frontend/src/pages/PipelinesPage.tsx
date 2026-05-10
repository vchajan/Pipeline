import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  useCreatePipeline,
  useCurrentUser,
  useDatasets,
  usePipelines,
} from "../api/queries";
import { canManageDefinitions } from "../auth/permissions";
import { DataTable } from "../components/DataTable";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { ErrorState, LoadingState } from "../components/StateBlock";
import { StatusBadge } from "../components/StatusBadge";
import type { Pipeline, PipelineInput } from "../types/domain";
import {
  formatDate,
  getMutationMessage,
  label,
  loadTypes,
  pipelineEngines,
  processingModes,
  targetLayers,
} from "./pageUtils";

const initialForm: PipelineInput = {
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

export function PipelinesPage() {
  const { data: user } = useCurrentUser();
  const datasetsQuery = useDatasets();
  const pipelinesQuery = usePipelines();
  const createPipeline = useCreatePipeline();
  const [form, setForm] = useState<PipelineInput>(initialForm);
  const canManage = canManageDefinitions(user?.role);

  useEffect(() => {
    if (datasetsQuery.data?.length && form.dataset_id === 0) {
      setForm((current) => ({ ...current, dataset_id: datasetsQuery.data[0].id }));
    }
  }, [datasetsQuery.data, form.dataset_id]);

  function updateField<Key extends keyof PipelineInput>(key: Key, value: PipelineInput[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createPipeline.mutate(
      {
        ...form,
        description: optionalText(form.description),
        schedule: optionalText(form.schedule),
      },
      {
        onSuccess: () => {
          setForm((current) => ({
            ...initialForm,
            dataset_id: current.dataset_id,
          }));
        },
      },
    );
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow="Definitions"
        title="Pipelines"
        description="Pipeline definitions, schedules, versions and run controls."
      />

      <SectionCard title="Create Pipeline" description="Admins can define simulated ETL/ELT processes.">
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Dataset</span>
            <select
              required
              value={form.dataset_id}
              disabled={!canManage || createPipeline.isPending || !datasetsQuery.data?.length}
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
              disabled={!canManage || createPipeline.isPending}
              onChange={(event) => updateField("name", event.target.value)}
            />
          </label>
          <label className="field">
            <span>Engine</span>
            <select
              value={form.engine}
              disabled={!canManage || createPipeline.isPending}
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
              disabled={!canManage || createPipeline.isPending}
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
              disabled={!canManage || createPipeline.isPending}
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
              disabled={!canManage || createPipeline.isPending}
              onChange={(event) => updateField("target_layer", event.target.value as PipelineInput["target_layer"])}
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
              placeholder="*/15 * * * *"
              value={form.schedule ?? ""}
              disabled={!canManage || createPipeline.isPending}
              onChange={(event) => updateField("schedule", event.target.value)}
            />
          </label>
          <label className="field field--checkbox">
            <input
              type="checkbox"
              checked={form.active}
              disabled={!canManage || createPipeline.isPending}
              onChange={(event) => updateField("active", event.target.checked)}
            />
            <span>Active</span>
          </label>
          <label className="field field--wide">
            <span>Description</span>
            <textarea
              rows={3}
              value={form.description ?? ""}
              disabled={!canManage || createPipeline.isPending}
              onChange={(event) => updateField("description", event.target.value)}
            />
          </label>
          <div className="form-actions">
            <button
              className="primary-button"
              type="submit"
              disabled={!canManage || createPipeline.isPending || form.dataset_id === 0}
            >
              Create pipeline
            </button>
            {!canManage ? <span className="muted">Admin role required.</span> : null}
            {createPipeline.isError ? (
              <span className="form-message form-message--error">{getMutationMessage(createPipeline.error)}</span>
            ) : null}
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Pipeline Definitions" description="Registered simulation processes.">
        {pipelinesQuery.isLoading ? <LoadingState title="Loading pipelines" /> : null}
        {pipelinesQuery.isError ? (
          <ErrorState title="Pipelines unavailable" message="The pipeline list request failed." />
        ) : null}
        {pipelinesQuery.data ? (
          <DataTable<Pipeline>
            rows={pipelinesQuery.data}
            getRowKey={(pipeline) => pipeline.id}
            emptyTitle="No pipelines"
            emptyMessage="Create a pipeline after at least one dataset exists."
            columns={[
              {
                header: "Name",
                render: (pipeline) => <Link to={`/pipelines/${pipeline.id}`}>{pipeline.name}</Link>,
              },
              {
                header: "Dataset",
                render: (pipeline) =>
                  datasetsQuery.data?.find((dataset) => dataset.id === pipeline.dataset_id)?.name ??
                  `Dataset #${pipeline.dataset_id}`,
              },
              { header: "Engine", render: (pipeline) => label(pipeline.engine) },
              { header: "Schedule", render: (pipeline) => pipeline.schedule ?? "Manual" },
              { header: "Active", render: (pipeline) => <StatusBadge value={pipeline.active} /> },
              { header: "Updated", render: (pipeline) => formatDate(pipeline.updated_at) },
            ]}
          />
        ) : null}
      </SectionCard>
    </section>
  );
}

function optionalText(value: string | null): string | null {
  return value && value.trim() ? value.trim() : null;
}
