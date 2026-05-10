import type { UserRole } from "../types/domain";

const roleRank: Record<UserRole, number> = {
  viewer: 1,
  operator: 2,
  admin: 3,
};

export function hasRole(userRole: UserRole | undefined, minimumRole: UserRole): boolean {
  if (!userRole) {
    return false;
  }
  return roleRank[userRole] >= roleRank[minimumRole];
}

export function canManageDefinitions(userRole: UserRole | undefined): boolean {
  return hasRole(userRole, "admin");
}

export function canOperateRuns(userRole: UserRole | undefined): boolean {
  return hasRole(userRole, "operator");
}

export function canRead(userRole: UserRole | undefined): boolean {
  return Boolean(userRole);
}
