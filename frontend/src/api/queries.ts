import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "./client";
import type {
  AlertEvent,
  AlertRule,
  AlertRuleInput,
  AlertRuleUpdate,
  AuditLog,
  AuthUser,
  DashboardSummary,
  Dataset,
  DatasetInput,
  DatasetUpdate,
  JobRun,
  JobRunCreateInput,
  JobRunUpdate,
  Pipeline,
  PipelineInput,
  PipelineUpdate,
  PipelineVersion,
  PipelineVersionInput,
  SystemStatus,
} from "../types/domain";

export const queryKeys = {
  auth: ["auth"] as const,
  dashboard: ["dashboard"] as const,
  datasets: ["datasets"] as const,
  dataset: (id: number) => ["datasets", id] as const,
  pipelines: ["pipelines"] as const,
  pipeline: (id: number) => ["pipelines", id] as const,
  pipelineRuns: (id: number) => ["pipelines", id, "runs"] as const,
  pipelineAlerts: (id: number) => ["pipelines", id, "alerts"] as const,
  pipelineVersions: (id: number) => ["pipelines", id, "versions"] as const,
  runs: ["runs"] as const,
  run: (id: number) => ["runs", id] as const,
  alertRules: ["alert-rules"] as const,
  alertRule: (id: number) => ["alert-rules", id] as const,
  alerts: ["alerts"] as const,
  alert: (id: number) => ["alerts", id] as const,
  system: ["system"] as const,
  auditLogs: ["audit-logs"] as const,
};

function jsonRequest<T>(path: string, method: string, body?: unknown) {
  return apiRequest<T>(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiRequest<AuthUser>("/auth/me"),
  });
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: [...queryKeys.dashboard, "summary"],
    queryFn: () => apiRequest<DashboardSummary>("/dashboard/summary"),
  });
}

export function useDatasets() {
  return useQuery({
    queryKey: queryKeys.datasets,
    queryFn: () => apiRequest<Dataset[]>("/datasets"),
  });
}

export function useDataset(datasetId: number | undefined) {
  return useQuery({
    queryKey: datasetId ? queryKeys.dataset(datasetId) : ["datasets", "missing"],
    queryFn: () => apiRequest<Dataset>(`/datasets/${datasetId}`),
    enabled: Boolean(datasetId),
  });
}

export function useCreateDataset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DatasetInput) => jsonRequest<Dataset>("/datasets", "POST", payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.datasets });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useUpdateDataset(datasetId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DatasetUpdate) =>
      jsonRequest<Dataset>(`/datasets/${datasetId}`, "PATCH", payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.datasets });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dataset(datasetId) });
    },
  });
}

export function usePipelines() {
  return useQuery({
    queryKey: queryKeys.pipelines,
    queryFn: () => apiRequest<Pipeline[]>("/pipelines"),
  });
}

export function usePipeline(pipelineId: number | undefined) {
  return useQuery({
    queryKey: pipelineId ? queryKeys.pipeline(pipelineId) : ["pipelines", "missing"],
    queryFn: () => apiRequest<Pipeline>(`/pipelines/${pipelineId}`),
    enabled: Boolean(pipelineId),
  });
}

export function useCreatePipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PipelineInput) => jsonRequest<Pipeline>("/pipelines", "POST", payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.pipelines });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useUpdatePipeline(pipelineId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PipelineUpdate) =>
      jsonRequest<Pipeline>(`/pipelines/${pipelineId}`, "PATCH", payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.pipelines });
      void queryClient.invalidateQueries({ queryKey: queryKeys.pipeline(pipelineId) });
    },
  });
}

export function useRunPipeline(pipelineId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: JobRunCreateInput = { trigger_type: "manual" }) =>
      jsonRequest<JobRun>(`/pipelines/${pipelineId}/run`, "POST", payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.runs });
      void queryClient.invalidateQueries({ queryKey: queryKeys.pipelineRuns(pipelineId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function usePipelineRuns(pipelineId: number | undefined) {
  return useQuery({
    queryKey: pipelineId ? queryKeys.pipelineRuns(pipelineId) : ["pipelines", "missing", "runs"],
    queryFn: () => apiRequest<JobRun[]>(`/pipelines/${pipelineId}/runs`),
    enabled: Boolean(pipelineId),
  });
}

export function usePipelineAlerts(pipelineId: number | undefined) {
  return useQuery({
    queryKey: pipelineId
      ? queryKeys.pipelineAlerts(pipelineId)
      : ["pipelines", "missing", "alerts"],
    queryFn: () => apiRequest<AlertEvent[]>(`/pipelines/${pipelineId}/alerts`),
    enabled: Boolean(pipelineId),
  });
}

export function usePipelineVersions(pipelineId: number | undefined) {
  return useQuery({
    queryKey: pipelineId
      ? queryKeys.pipelineVersions(pipelineId)
      : ["pipelines", "missing", "versions"],
    queryFn: () => apiRequest<PipelineVersion[]>(`/pipelines/${pipelineId}/versions`),
    enabled: Boolean(pipelineId),
  });
}

export function useCreatePipelineVersion(pipelineId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PipelineVersionInput) =>
      jsonRequest<PipelineVersion>(`/pipelines/${pipelineId}/versions`, "POST", payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.pipelineVersions(pipelineId) });
    },
  });
}

export function useActivatePipelineVersion(pipelineId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (versionId: number) =>
      jsonRequest<PipelineVersion>(`/pipeline-versions/${versionId}/activate`, "PATCH"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.pipelineVersions(pipelineId) });
    },
  });
}

export function useRuns() {
  return useQuery({
    queryKey: queryKeys.runs,
    queryFn: () => apiRequest<JobRun[]>("/runs"),
  });
}

export function useRun(runId: number | undefined) {
  return useQuery({
    queryKey: runId ? queryKeys.run(runId) : ["runs", "missing"],
    queryFn: () => apiRequest<JobRun>(`/runs/${runId}`),
    enabled: Boolean(runId),
  });
}

export function useUpdateRun(runId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: JobRunUpdate) => jsonRequest<JobRun>(`/runs/${runId}`, "PATCH", payload),
    onSuccess: (run) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.runs });
      void queryClient.invalidateQueries({ queryKey: queryKeys.run(runId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.pipelineRuns(run.pipeline_id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useCancelRun(runId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => jsonRequest<JobRun>(`/runs/${runId}/cancel`, "PATCH"),
    onSuccess: (run) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.runs });
      void queryClient.invalidateQueries({ queryKey: queryKeys.run(runId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.pipelineRuns(run.pipeline_id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useAlertRules() {
  return useQuery({
    queryKey: queryKeys.alertRules,
    queryFn: () => apiRequest<AlertRule[]>("/alert-rules"),
  });
}

export function useAlertRule(ruleId: number | undefined) {
  return useQuery({
    queryKey: ruleId ? queryKeys.alertRule(ruleId) : ["alert-rules", "missing"],
    queryFn: () => apiRequest<AlertRule>(`/alert-rules/${ruleId}`),
    enabled: Boolean(ruleId),
  });
}

export function useCreateAlertRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AlertRuleInput) =>
      jsonRequest<AlertRule>("/alert-rules", "POST", payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.alertRules });
    },
  });
}

export function useUpdateAlertRule(ruleId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AlertRuleUpdate) =>
      jsonRequest<AlertRule>(`/alert-rules/${ruleId}`, "PATCH", payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.alertRules });
      void queryClient.invalidateQueries({ queryKey: queryKeys.alertRule(ruleId) });
    },
  });
}

export function useDeleteAlertRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: number) => jsonRequest<void>(`/alert-rules/${ruleId}`, "DELETE"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.alertRules });
    },
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: queryKeys.alerts,
    queryFn: () => apiRequest<AlertEvent[]>("/alerts"),
  });
}

export function useAlert(alertId: number | undefined) {
  return useQuery({
    queryKey: alertId ? queryKeys.alert(alertId) : ["alerts", "missing"],
    queryFn: () => apiRequest<AlertEvent>(`/alerts/${alertId}`),
    enabled: Boolean(alertId),
  });
}

export function useAcknowledgeAlert(alertId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => jsonRequest<AlertEvent>(`/alerts/${alertId}/acknowledge`, "PATCH"),
    onSuccess: (alert) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
      void queryClient.invalidateQueries({ queryKey: queryKeys.alert(alertId) });
      if (alert.pipeline_id) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.pipelineAlerts(alert.pipeline_id) });
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useResolveAlert(alertId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => jsonRequest<AlertEvent>(`/alerts/${alertId}/resolve`, "PATCH"),
    onSuccess: (alert) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
      void queryClient.invalidateQueries({ queryKey: queryKeys.alert(alertId) });
      if (alert.pipeline_id) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.pipelineAlerts(alert.pipeline_id) });
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useSystemStatus() {
  return useQuery({
    queryKey: queryKeys.system,
    queryFn: () => apiRequest<SystemStatus>("/system/status"),
    refetchInterval: 15000,
  });
}

export function useAuditLogs() {
  return useQuery({
    queryKey: queryKeys.auditLogs,
    queryFn: () => apiRequest<AuditLog[]>("/audit-logs"),
  });
}
