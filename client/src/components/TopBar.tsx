import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import type { Notification } from "@shared/schema";

const TITLES: Record<string, string> = {
  "/": "Главная",
  "/dashboard": "Главная",
  "/profile": "Мой профиль",
  "/users": "Сотрудники",
  "/tasks": "Задачи",
  "/documents": "Документы",
  "/knowledge": "База знаний",
  "/surveys": "Опросы",
  "/hr-requests": "Обращения в HR",
  "/calendar": "Календарь",
  "/onboarding": "Адаптация",
  "/notifications": "Уведомления",
};

export function TopBar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const title = TITLES[location] || "Harvest HR";

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
    refetchInterval: 30_000,
  });
  const unread = notifications.filter((n) => !n.isRead).length;

  const today = new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
      <h1 className="text-xl font-bold text-primary tracking-tight" data-testid="text-page-title">
        {title}
      </h1>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="capitalize">{today}</span>
        <a
          href="#/notifications"
          className="relative inline-flex items-center justify-center w-9 h-9 rounded-md border border-border bg-card hover-elevate"
          data-testid="link-notifications-topbar"
        >
          <Bell size={16} />
          {unread > 0 && (
            <span
              className="absolute top-1 right-1 w-2 h-2 rounded-full"
              style={{ background: "hsl(var(--destructive))" }}
              data-testid="dot-unread"
            />
          )}
        </a>
      </div>
    </header>
  );
}
