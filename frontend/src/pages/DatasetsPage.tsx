import type { FormEvent } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { useCreateDataset, useCurrentUser, useDatasets } from "../api/queries";
import { canManageDefinitions } from "../auth/permissions";
import { DataTable } from "../components/DataTable";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { ErrorState, LoadingState } from "../components/StateBlock";
import { StatusBadge } from "../components/StatusBadge";
import type { Dataset, DatasetInput } from "../types/domain";
import { datasetSourceTypes, formatDate, getMutationMessage, label } from "./pageUtils";

const initialForm: DatasetInput = {
  name: "",
  description: "",
  owner: "",
  source_type: "csv_file",
  schema_version: "",
};

export function DatasetsPage() {
  const { data: user } = useCurrentUser();
  const datasetsQuery = useDatasets();
  const createDataset = useCreateDataset();
  const [form, setForm] = useState<DatasetInput>(initialForm);
  const canManage = canManageDefinitions(user?.role);

  function updateField<Key extends keyof DatasetInput>(key: Key, value: DatasetInput[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createDataset.mutate(
      {
        ...form,
        description: optionalText(form.description),
        owner: optionalText(form.owner),
        schema_version: optionalText(form.schema_version),
      },
      {
        onSuccess: () => setForm(initialForm),
      },
    );
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow="Catalog"
        title="Datasets"
        description="Dataset metadata, source ownership and schema versions."
      />

      <SectionCard
        title="Create Dataset"
        description="Admins can register source metadata for pipelines to use."
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Name</span>
            <input
              required
              value={form.name}
              disabled={!canManage || createDataset.isPending}
              onChange={(event) => updateField("name", event.target.value)}
            />
          </label>
          <label className="field">
            <span>Source type</span>
            <select
              value={form.source_type}
              disabled={!canManage || createDataset.isPending}
              onChange={(event) => updateField("source_type", event.target.value as DatasetInput["source_type"])}
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
              disabled={!canManage || createDataset.isPending}
              onChange={(event) => updateField("owner", event.target.value)}
            />
          </label>
          <label className="field">
            <span>Schema version</span>
            <input
              value={form.schema_version ?? ""}
              disabled={!canManage || createDataset.isPending}
              onChange={(event) => updateField("schema_version", event.target.value)}
            />
          </label>
          <label className="field field--wide">
            <span>Description</span>
            <textarea
              rows={3}
              value={form.description ?? ""}
              disabled={!canManage || createDataset.isPending}
              onChange={(event) => updateField("description", event.target.value)}
            />
          </label>
          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={!canManage || createDataset.isPending}>
              Create dataset
            </button>
            {!canManage ? <span className="muted">Admin role required.</span> : null}
            {createDataset.isError ? (
              <span className="form-message form-message--error">{getMutationMessage(createDataset.error)}</span>
            ) : null}
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Dataset Catalog" description="Sources available for pipeline definitions.">
        {datasetsQuery.isLoading ? <LoadingState title="Loading datasets" /> : null}
        {datasetsQuery.isError ? (
          <ErrorState title="Datasets unavailable" message="The dataset list request failed." />
        ) : null}
        {datasetsQuery.data ? (
          <DataTable<Dataset>
            rows={datasetsQuery.data}
            getRowKey={(dataset) => dataset.id}
            emptyTitle="No datasets"
            emptyMessage="Create a dataset before defining pipelines."
            columns={[
              {
                header: "Name",
                render: (dataset) => <Link to={`/datasets/${dataset.id}`}>{dataset.name}</Link>,
              },
              { header: "Source", render: (dataset) => <StatusBadge value={dataset.source_type} /> },
              { header: "Owner", render: (dataset) => dataset.owner ?? "Not set" },
              { header: "Schema", render: (dataset) => dataset.schema_version ?? "Not set" },
              { header: "Updated", render: (dataset) => formatDate(dataset.updated_at) },
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
