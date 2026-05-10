import {
  Activity,
  AlertTriangle,
  Bell,
  Database,
  FileClock,
  Gauge,
  GitBranch,
  ListChecks,
  ScrollText,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { demoUsers, getDemoUserId, setDemoUserId } from "../auth/session";
import { useCurrentUser } from "../api/queries";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: Gauge },
  { label: "Datasets", path: "/datasets", icon: Database },
  { label: "Pipelines", path: "/pipelines", icon: GitBranch },
  { label: "Runs", path: "/runs", icon: Activity },
  { label: "Alert Rules", path: "/alert-rules", icon: ListChecks },
  { label: "Alerts", path: "/alerts", icon: Bell },
  { label: "Users", path: "/users", icon: Users },
  { label: "Audit Logs", path: "/audit-logs", icon: ScrollText },
  { label: "System Status", path: "/system-status", icon: Settings },
];

export function AppLayout() {
  const queryClient = useQueryClient();
  const [activeDemoUserId, setActiveDemoUserId] = useState(getDemoUserId);
  const { data: user, isError } = useCurrentUser();

  function handleDemoUserChange(userId: string) {
    setDemoUserId(userId);
    setActiveDemoUserId(userId);
    void queryClient.invalidateQueries({ queryKey: ["auth"] });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <div className="brand__mark">
            <FileClock aria-hidden="true" />
          </div>
          <div>
            <span>Pipeline</span>
            <strong>Monitor</strong>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              >
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="topbar__status">
            <Shield aria-hidden="true" />
            <span>{user ? `${user.display_name} - ${user.role}` : "Demo auth fallback"}</span>
          </div>
          <div className="role-switcher" aria-label="Demo user selector">
            {demoUsers.map((demoUser) => (
              <button
                className="role-switcher__button"
                data-active={activeDemoUserId === demoUser.id}
                key={demoUser.id}
                type="button"
                onClick={() => handleDemoUserChange(demoUser.id)}
              >
                {demoUser.label}
              </button>
            ))}
          </div>
          {isError ? (
            <div className="topbar__warning">
              <AlertTriangle aria-hidden="true" />
              <span>Backend auth is not reachable</span>
            </div>
          ) : null}
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
