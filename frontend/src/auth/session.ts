import type { UserRole } from "../types/domain";

const tokenKey = "pipeline-monitor.auth-token";
const demoUserKey = "pipeline-monitor.demo-user-id";

export const demoUsers: Array<{ id: string; label: string; role: UserRole }> = [
  { id: "1", label: "Admin", role: "admin" },
  { id: "2", label: "Operator", role: "operator" },
  { id: "3", label: "Viewer", role: "viewer" },
];

export function getAuthToken(): string | null {
  return window.localStorage.getItem(tokenKey);
}

export function setAuthToken(token: string): void {
  window.localStorage.setItem(tokenKey, token);
}

export function clearAuthToken(): void {
  window.localStorage.removeItem(tokenKey);
}

export function getDemoUserId(): string {
  return window.localStorage.getItem(demoUserKey) ?? "1";
}

export function setDemoUserId(userId: string): void {
  window.localStorage.setItem(demoUserKey, userId);
}

export function buildAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return { "X-Demo-User-Id": getDemoUserId() };
}
