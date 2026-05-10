import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useCurrentUser, useDataset, usePipelines, useUpdateDataset } from "../api/queries";
import { canManageDefinitions } from "../auth/permissions";
import { DataTable } from "../components/DataTable";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { EmptyState, ErrorState, LoadingState } from "../components/StateBlock";
import { StatusBadge } from "../components/StatusBadge";
import type { DatasetInput, Pipeline } from "../types/domain";
import { datasetSourceTypes, formatDate, getMutationMessage, label } from "./pageUtils";

const emptyForm: DatasetInput = {
  name: "",
  description: "",
  owner: "",
  source_type: "csv_file",
  schema_version: "",
};

export function DatasetDetailPage() {
  const datasetId = Number(useParams().datasetId);
  const { data: user } = useCurrentUser();
  const datasetQuery = useDataset(Number.isFinite(datasetId) ? datasetId : undefined);
  const pipelinesQuery = usePipelines();
  const updateDataset = useUpdateDataset(datasetId);
  const [form, setForm] = useState<DatasetInput>(emptyForm);
  const canManage = canManageDefinitions(user?.role);

  useEffect(() => {
    if (datasetQuery.data) {
      setForm({
        name: datasetQuery.data.name,
        description: datasetQuery.data.description ?? "",
        owner: datasetQuery.data.owner ?? "",
        source_type: datasetQuery.data.source_type,
        schema_version: datasetQuery.data.schema_version ?? "",
      });
    }
  }, [datasetQuery.data]);

  const linkedPipelines = (pipelinesQuery.data ?? []).filter((pipeline) => pipeline.dataset_id === datasetId);

  function updateField<Key extends keyof DatasetInput>(key: Key, value: DatasetInput[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateDataset.mutate({
      ...form,
      description: optionalText(form.description),
      owner: optionalText(form.owner),
      schema_version: optionalText(form.schema_version),
    });
  }

  if (!Number.isFinite(datasetId)) {
    return <EmptyState title="Dataset not found" message="The route did not include a valid dataset id." />;
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow="Catalog"
        title={datasetQuery.data?.name ?? "Dataset detail"}
        description="Dataset profile, linked pipelines and metadata maintenance."
      />

      {datasetQuery.isLoading ? <LoadingState title="Loading dataset" /> : null}
      {datasetQuery.isError ? (
        <ErrorState title="Dataset unavailable" message="The dataset detail request failed." />
      ) : null}

      {datasetQuery.data ? (
        <>
          <SectionCard title="Profile" description="Core dataset metadata from the catalog.">
            <dl className="detail-grid">
              <Detail label="Source type" value={<StatusBadge value={datasetQuery.data.source_type} />} />
              <Detail label="Owner" value={datasetQuery.data.owner ?? "Not set"} />
              <Detail label="Schema version" value={datasetQuery.data.schema_version ?? "Not set"} />
              <Detail label="Created" value={formatDate(datasetQuery.data.created_at)} />
              <Detail label="Updated" value={formatDate(datasetQuery.data.updated_at)} />
            </dl>
          </SectionCard>

          <SectionCard title="Edit Dataset" description="Admin-only metadata changes.">
            <form className="form-grid" onSubmit={handleSubmit}>
              <label className="field">
                <span>Name</span>
                <input
                  required
                  value={form.name}
                  disabled={!canManage || updateDataset.isPending}
                  onChange={(event) => updateField("name", event.target.value)}
                />
              </label>
              <label className="field">
                <span>Source type</span>
                <select
                  value={form.source_type}
                  disabled={!canManage || updateDataset.isPending}
                  onChange={(event) =>
                    updateField("source_type", event.target.value as DatasetInput["source_type"])
                  }
                >
                  {datasetSourceTypes.map((sourceType) => (
                    <option key={sourceType} value={sourceType}>
                      {label(sourceType)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Owner</span>
                <input
                  value={form.owner ?? ""}
                  disabled={!canManage || updateDataset.isPending}
                  onChange={(event) => updateField("owner", event.target.value)}
                />
              </label>
              <label className="field">
                <span>Schema version</span>
                <input
                  value={form.schema_version ?? ""}
                  disabled={!canManage || updateDataset.isPending}
                  onChange={(event) => updateField("schema_version", event.target.value)}
                />
              </label>
              <label className="field field--wide">
                <span>Description</span>
                <textarea
                  rows={3}
                  value={form.description ?? ""}
                  disabled={!canManage || updateDataset.isPending}
                  onChange={(event) => updateField("description", event.target.value)}
                />
              </label>
              <div className="form-actions">
                <button className="primary-button" type="submit" disabled={!canManage || updateDataset.isPending}>
                  Save changes
                </button>
                {!canManage ? <span className="muted">Admin role required.</span> : null}
                {updateDataset.isError ? (
                  <span className="form-message form-message--error">{getMutationMessage(updateDataset.error)}</span>
                ) : null}
                {updateDataset.isSuccess ? <span className="form-message">Dataset updated.</span> : null}
              </div>
            </form>
          </SectionCard>

          <SectionCard title="Linked Pipelines" description="Pipelines using this dataset.">
            {pipelinesQuery.isLoading ? <LoadingState title="Loading pipelines" /> : null}
            {pipelinesQuery.isError ? (
              <ErrorState title="Pipelines unavailable" message="The pipeline list request failed." />
            ) : null}
            {pipelinesQuery.data ? (
              <DataTable<Pipeline>
                rows={linkedPipelines}
                getRowKey={(pipeline) => pipeline.id}
                emptyTitle="No linked pipelines"
                emptyMessage="Create a pipeline for this dataset from the pipelines page."
                columns={[
                  {
                    header: "Pipeline",
                    render: (pipeline) => <Link to={`/pipelines/${pipeline.id}`}>{pipeline.name}</Link>,
                  },
                  { header: "Engine", render: (pipeline) => label(pipeline.engine) },
                  { header: "Mode", render: (pipeline) => label(pipeline.processing_mode) },
                  { header: "Active", render: (pipeline) => <StatusBadge value={pipeline.active} /> },
                ]}
              />
            ) : null}
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

function optionalText(value: string | null): string | null {
  return value && value.trim() ? value.trim() : null;
}
