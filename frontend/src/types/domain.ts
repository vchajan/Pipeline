export type UserRole = "admin" | "operator" | "viewer";

export interface AuthUser {
  id: number;
  email: string;
  display_name: string;
  role: UserRole;
  external_subject: string | null;
  created_at: string;
}

export interface DashboardSummary {
  datasets_count: number;
  pipelines_count: number;
  active_pipelines_count: number;
  runs_count: number;
  open_alerts_count: number;
  runs_by_status: Record<string, number>;
}

export interface NavigationItem {
  label: string;
  path: string;
  description: string;
}
