import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { HarvestLogo } from "./HarvestLogo";
import {
  LayoutDashboard,
  User,
  Users,
  CheckSquare,
  FileText,
  BookOpen,
  ClipboardList,
  MessageSquare,
  Calendar,
  GraduationCap,
  Bell,
  LogOut,
  Layers,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Notification } from "@shared/schema";

interface NavItem {
  to: string;
  label: string;
  icon: any;
  roles?: string[];
  badge?: number;
  group?: string;
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
    refetchInterval: 30_000,
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!user) return null;

  const items: NavItem[] = [
    { to: "/dashboard", label: "Главная", icon: LayoutDashboard, group: "Основное" },
    { to: "/profile", label: "Мой профиль", icon: User, group: "Основное" },
    { to: "/notifications", label: "Уведомления", icon: Bell, badge: unreadCount, group: "Основное" },
    { to: "/users", label: "Сотрудники", icon: Users, roles: ["hr", "manager", "admin"], group: "Управление" },
    { to: "/tasks", label: "Задачи", icon: CheckSquare, group: "Управление" },
    { to: "/hr-requests", label: "Обращения в HR", icon: MessageSquare, group: "Управление" },
    { to: "/calendar", label: "Календарь", icon: Calendar, group: "Управление" },
    { to: "/documents", label: "Документы", icon: FileText, group: "Контент" },
    { to: "/knowledge", label: "База знаний", icon: BookOpen, group: "Контент" },
    { to: "/surveys", label: "Опросы", icon: ClipboardList, group: "Контент" },
    { to: "/onboarding", label: "Адаптация", icon: GraduationCap, group: "Обучение" },
    { to: "/learning", label: "Обучение", icon: Layers, group: "Обучение" },
  ];

  const visible = items.filter((i) => !i.roles || i.roles.includes(user.roleCode));

  const groups = ["Основное", "Управление", "Контент", "Обучение"];

  const roleLabel: Record<string, string> = {
    admin: "Администратор",
    hr: "HR",
    manager: "Руководитель",
    employee: "Сотрудник",
  };

  const roleColors: Record<string, { bg: string; text: string }> = {
    admin: { bg: "rgba(220,38,38,0.18)", text: "#fca5a5" },
    hr: { bg: "rgba(200,168,67,0.22)", text: "hsl(43,78%,65%)" },
    manager: { bg: "rgba(59,130,246,0.18)", text: "#93c5fd" },
    employee: { bg: "rgba(255,255,255,0.1)", text: "rgba(255,255,255,0.6)" },
  };
  const rc = roleColors[user.roleCode] || roleColors.employee;

  return (
    <aside
      className="fixed top-0 left-0 h-screen w-[240px] flex flex-col text-sm overflow-y-auto"
      style={{
        background: "hsl(var(--sidebar))",
        color: "hsl(var(--sidebar-foreground))",
        borderRight: "1px solid hsl(var(--sidebar-border))",
      }}
      data-testid="sidebar"
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <div style={{ color: "hsl(var(--sidebar-primary))" }}>
          <HarvestLogo />
        </div>
      </div>

      {/* User card */}
      <div
        className="mx-3 mb-4 rounded-xl p-3"
        style={{ background: "hsl(var(--sidebar-accent))", border: "1px solid hsl(var(--sidebar-border))" }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold mb-2"
          style={{ background: "hsl(var(--sidebar-primary))", color: "hsl(var(--sidebar-primary-foreground))" }}
        >
          {user.firstName?.[0]}{user.lastName?.[0]}
        </div>
        <div className="font-semibold text-sm leading-tight" data-testid="text-username">
          {user.firstName} {user.lastName}
        </div>
        <div className="text-[11px] opacity-50 mt-0.5 truncate" data-testid="text-user-email">
          {user.email}
        </div>
        <span
          className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: rc.bg, color: rc.text }}
          data-testid="badge-role"
        >
          {roleLabel[user.roleCode] || user.roleCode}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 pb-2 space-y-4">
        {groups.map((group) => {
          const groupItems = visible.filter((i) => i.group === group);
          if (groupItems.length === 0) return null;
          return (
            <div key={group}>
              <div
                className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.28)" }}
              >
                {group}
              </div>
              <div className="space-y-0.5">
                {groupItems.map((item) => {
                  const isActive = location === item.to || (item.to === "/dashboard" && location === "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      href={item.to}
                      className="nav-item-glow flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer"
                      style={{
                        background: isActive ? "rgba(200,168,67,0.16)" : "transparent",
                        color: isActive ? "hsl(var(--sidebar-primary))" : "hsl(var(--sidebar-foreground))",
                        fontWeight: isActive ? 600 : 400,
                      }}
                      data-testid={`link-${item.to.slice(1)}`}
                    >
                      <Icon size={15} style={{ opacity: isActive ? 1 : 0.65 }} />
                      <span className="text-[13px]">{item.label}</span>
                      {item.badge && item.badge > 0 ? (
                        <span
                          className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: "hsl(var(--destructive))", color: "white" }}
                          data-testid={`badge-${item.to.slice(1)}`}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        <button
          className="w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          style={{ background: "rgba(230,57,70,0.12)", color: "#fca5a5", border: "1px solid rgba(230,57,70,0.22)" }}
          onClick={logout}
          data-testid="button-logout"
        >
          <LogOut size={13} /> Выйти
        </button>
      </div>
    </aside>
  );
}
