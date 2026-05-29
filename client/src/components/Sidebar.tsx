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
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Notification } from "@shared/schema";

interface NavItem {
  to: string;
  label: string;
  icon: any;
  roles?: string[]; // visible to these roles only; undefined = all
  badge?: number;
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
    { to: "/dashboard", label: "Главная", icon: LayoutDashboard },
    { to: "/profile", label: "Мой профиль", icon: User },
    { to: "/users", label: "Сотрудники", icon: Users, roles: ["hr", "manager", "admin"] },
    { to: "/tasks", label: "Задачи", icon: CheckSquare },
    { to: "/documents", label: "Документы", icon: FileText },
    { to: "/knowledge", label: "База знаний", icon: BookOpen },
    { to: "/surveys", label: "Опросы", icon: ClipboardList },
    { to: "/hr-requests", label: "Обращения в HR", icon: MessageSquare },
    { to: "/calendar", label: "Календарь", icon: Calendar },
    { to: "/onboarding", label: "Адаптация", icon: GraduationCap },
    { to: "/learning", label: "Обучение", icon: BookOpen },
    { to: "/notifications", label: "Уведомления", icon: Bell, badge: unreadCount },
  ];

  const visible = items.filter((i) => !i.roles || i.roles.includes(user.roleCode));

  const roleLabel: Record<string, string> = {
    admin: "Администратор",
    hr: "HR",
    manager: "Руководитель",
    employee: "Сотрудник",
  };

  return (
    <aside
      className="fixed top-0 left-0 h-screen w-[240px] flex flex-col text-sm overflow-y-auto"
      style={{ background: "#003050", color: "hsl(var(--sidebar-foreground))" }}
      data-testid="sidebar"
    >
      <div className="px-5 pt-5 pb-4 border-b border-white/10">
        <div style={{ color: "hsl(var(--sidebar-primary))" }}>
          <HarvestLogo />
        </div>
        <div className="text-[10px] mt-2 opacity-50 tracking-wider">HR ПЛАТФОРМА</div>
      </div>

      <div className="px-5 py-4 border-b border-white/10">
        <div className="font-semibold" data-testid="text-username">
          {user.firstName} {user.lastName}
        </div>
        <div className="text-xs opacity-60 mt-0.5" data-testid="text-user-email">
          {user.email}
        </div>
        <span
          className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{
            background: user.roleCode === "admin" ? "#dc2626" : user.roleCode === "hr" ? "hsl(var(--accent))" : "rgba(255,255,255,0.15)",
            color: user.roleCode === "hr" ? "hsl(var(--accent-foreground))" : "white",
          }}
          data-testid="badge-role"
        >
          {roleLabel[user.roleCode] || user.roleCode}
        </span>
      </div>

      <nav className="flex-1 py-2">
        {visible.map((item) => {
          const isActive = location === item.to || (item.to === "/dashboard" && location === "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              href={item.to}
              className="flex items-center gap-2.5 px-5 py-2.5 cursor-pointer transition border-l-[3px] hover:bg-white/5"
              style={{
                borderLeftColor: isActive ? "#DDB12C" : "transparent",
                background: isActive ? "rgba(221,177,44,0.15)" : "transparent",
                color: isActive ? "#DDB12C" : "inherit",
              }}
              data-testid={`link-${item.to.slice(1)}`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span
                  className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: "hsl(var(--destructive))", color: "white" }}
                  data-testid={`badge-${item.to.slice(1)}`}
                >
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-white/10">
        <button
          className="w-full px-3 py-2 rounded-md text-xs font-medium flex items-center justify-center gap-2 hover-elevate"
          style={{ background: "rgba(230,57,70,0.15)", color: "#fca5a5", border: "1px solid rgba(230,57,70,0.3)" }}
          onClick={logout}
          data-testid="button-logout"
        >
          <LogOut size={14} /> Выйти
        </button>
      </div>
    </aside>
  );
}
