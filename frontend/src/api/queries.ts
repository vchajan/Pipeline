import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "./client";
import type { AuthUser, DashboardSummary } from "../types/domain";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiRequest<AuthUser>("/auth/me"),
  });
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: () => apiRequest<DashboardSummary>("/dashboard/summary"),
  });
}
