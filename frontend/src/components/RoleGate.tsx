import type { ReactNode } from "react";

import { hasRole } from "../auth/permissions";
import type { UserRole } from "../types/domain";

interface RoleGateProps {
  role?: UserRole;
  minimumRole: UserRole;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGate({ role, minimumRole, children, fallback = null }: RoleGateProps) {
  if (!hasRole(role, minimumRole)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
