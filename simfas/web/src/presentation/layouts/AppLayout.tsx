/**
 * Shell aplikasi: sidebar desktop + bottom-nav mobile.
 * Responsif penuh (PRD §8).
 */

import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Table2,
  ClipboardList,
  Map,
  Users,
  Settings,
  ScrollText,
  LogOut,
  Menu,
  Moon,
  Sun,
  Ship,
  Database,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/presentation/hooks/use-auth";
import { useTheme } from "@/presentation/hooks/use-theme";
import { Button } from "@/presentation/components/ui/button";
import { cn } from "@/presentation/lib/utils";
import { hasPermission, roleLabel, type Permission } from "@simfas/shared";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Permission;
}

const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/laporan", label: "Laporan Cabang", icon: Table2, permission: "report:view_branch" },
  { to: "/rekap", label: "Rekap Regional", icon: Map, permission: "report:view_region" },
  { to: "/inspeksi", label: "Inspeksi", icon: ClipboardList, permission: "inspection:create" },
  { to: "/master", label: "Master Data", icon: Database, permission: "master:edit_branch" },
  { to: "/pengguna", label: "Pengguna", icon: Users, permission: "user:manage" },
  { to: "/audit", label: "Audit Log", icon: ScrollText, permission: "audit:view" },
  { to: "/tema", label: "Tema", icon: Settings },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const items = NAV.filter(
    (n) =>
      !n.permission ||
      hasPermission(user.role, n.permission) ||
      // management punya view_all → tampilkan rekap
      (n.permission === "report:view_region" &&
        hasPermission(user.role, "report:view_all")) ||
      (n.permission === "report:view_branch" &&
        (hasPermission(user.role, "report:view_all") ||
          hasPermission(user.role, "report:view_region")))
  );

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-5">
          <Ship className="h-7 w-7 text-sidebar-primary" />
          <div>
            <div className="text-sm font-bold tracking-wide">SIMFAS</div>
            <div className="text-[10px] opacity-80">PT Pelabuhan Indonesia</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "hover:bg-sidebar-accent/50"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-4 text-xs">
          <div className="font-medium">{user.name}</div>
          <div className="opacity-75">{roleLabel(user.role)}</div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" /> Keluar
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-semibold md:hidden">SIMFAS</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleMode} aria-label="Toggle theme">
              {mode === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user.email}
            </span>
          </div>
        </header>

        {/* Mobile drawer */}
        {open && (
          <div className="border-b border-border bg-card p-2 md:hidden">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                    isActive ? "bg-accent font-medium" : "hover:bg-muted"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4" /> Keluar
            </button>
          </div>
        )}

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
