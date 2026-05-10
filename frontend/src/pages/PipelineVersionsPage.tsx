import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  useActivatePipelineVersion,
  useCreatePipelineVersion,
  useCurrentUser,
  usePipeline,
  usePipelineVersions,
} from "../api/queries";
import { canManageDefinitions } from "../auth/permissions";
import { DataTable } from "../components/DataTable";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { EmptyState, ErrorState, LoadingState } from "../components/StateBlock";
import { StatusBadge } from "../components/StatusBadge";
import type { PipelineVersion } from "../types/domain";
import { formatDate, getMutationMessage, parseJsonConfig } from "./pageUtils";

export function PipelineVersionsPage() {
  const pipelineId = Number(useParams().pipelineId);
  const { data: user } = useCurrentUser();
  const pipelineQuery = usePipeline(Number.isFinite(pipelineId) ? pipelineId : undefined);
  const versionsQuery = usePipelineVersions(Number.isFinite(pipelineId) ? pipelineId : undefined);
  const createVersion = useCreatePipelineVersion(pipelineId);
  const activateVersion = useActivatePipelineVersion(pipelineId);
  const [versionNumber, setVersionNumber] = useState("1");
  const [active, setActive] = useState(false);
  const [configText, setConfigText] = useState(
    '{\n  "failure_probability": 0.1,\n  "min_runtime_seconds": 2,\n  "max_runtime_seconds": 6,\n  "records_min": 500,\n  "records_max": 5000\n}',
  );
  const [formError, setFormError] = useState<string | null>(null);
  const canManage = canManageDefinitions(user?.role);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    try {
      createVersion.mutate(
        {
          version_number: Number(versionNumber),
          active,
          config_json: parseJsonConfig(configText),
        },
        {
          onSuccess: () => {
            setVersionNumber(String(Number(versionNumber) + 1));
            setActive(false);
          },
        },
      );
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Invalid configuration JSON.");
    }
  }

  if (!Number.isFinite(pipelineId)) {
    return <EmptyState title="Pipeline not found" message="The route did not include a valid pipeline id." />;
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow="Definitions"
        title={`${pipelineQuery.data?.name ?? "Pipeline"} versions`}
        description="Versioned execution settings and active-version management."
        actions={
          <Link className="secondary-button" to={`/pipelines/${pipelineId}`}>
            Pipeline detail
          </Link>
        }
      />

      <SectionCard title="Create Version" description="Admins can add deterministic simulation settings.">
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Version number</span>
            <input
              min={1}
              required
              type="number"
              value={versionNumber}
              disabled={!canManage || createVersion.isPending}
              onChange={(event) => setVersionNumber(event.target.value)}
            />
          </label>
          <label className="field field--checkbox">
            <input
              type="checkbox"
              checked={active}
              disabled={!canManage || createVersion.isPending}
              onChange={(event) => setActive(event.target.checked)}
            />
            <span>Activate immediately</span>
          </label>
          <label className="field field--wide">
            <span>Config JSON</span>
            <textarea
              rows={9}
              value={configText}
              disabled={!canManage || createVersion.isPending}
              onChange={(event) => setConfigText(event.target.value)}
            />
          </label>
          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={!canManage || createVersion.isPending}>
              Create version
            </button>
            {!canManage ? <span className="muted">Admin role required.</span> : null}
            {formError ? <span className="form-message form-message--error">{formError}</span> : null}
            {createVersion.isError ? (
              <span className="form-message form-message--error">{getMutationMessage(createVersion.error)}</span>
            ) : null}
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Versions" description="Only one version can be active for a pipeline.">
        {versionsQuery.isLoading ? <LoadingState title="Loading versions" /> : null}
        {versionsQuery.isError ? (
          <ErrorState title="Versions unavailable" message="The pipeline versions request failed." />
        ) : null}
        {versionsQuery.data ? (
          <DataTable<PipelineVersion>
            rows={versionsQuery.data}
            getRowKey={(version) => version.id}
            emptyTitle="No versions"
            emptyMessage="Create the first version before running this pipeline."
            columns={[
              { header: "Version", render: (version) => `v${version.version_number}` },
              { header: "Active", render: (version) => <StatusBadge value={version.active} /> },
              { header: "Created by", render: (version) => version.created_by ?? "System" },
              { header: "Created", render: (version) => formatDate(version.created_at) },
              {
                header: "Config",
                render: (version) => <code>{Object.keys(version.config_json).length} keys</code>,
              },
              {
                header: "Actions",
                render: (version) => (
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={!canManage || version.active || activateVersion.isPending}
                    onClick={() => activateVersion.mutate(version.id)}
                  >
                    Activate
                  </button>
                ),
              },
            ]}
          />
        ) : null}
        {activateVersion.isError ? (
          <p className="form-message form-message--error">{getMutationMessage(activateVersion.error)}</p>
        ) : null}
      </SectionCard>
    </section>
  );
}
