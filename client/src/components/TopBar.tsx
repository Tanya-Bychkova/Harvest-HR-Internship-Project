import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Bell, Search } from "lucide-react";
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
  "/learning": "Обучение",
  "/notifications": "Уведомления",
};

const SUBTITLES: Record<string, string> = {
  "/dashboard": "Обзор вашей активности",
  "/users": "Управление командой",
  "/tasks": "Текущие задачи и поручения",
  "/documents": "Корпоративные файлы",
  "/knowledge": "Внутренние статьи и гайды",
  "/surveys": "Опросы и обратная связь",
  "/hr-requests": "Запросы к HR-отделу",
  "/calendar": "Мероприятия и события",
  "/onboarding": "Программа адаптации",
  "/learning": "Курсы и материалы",
  "/profile": "Ваши данные",
  "/notifications": "Входящие уведомления",
};

export function TopBar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const title = TITLES[location] || "Harvest HR";
  const subtitle = SUBTITLES[location] || "";

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
    refetchInterval: 30_000,
  });
  const unread = notifications.filter((n) => !n.isRead).length;

  const today = new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });

  return (
    <header
      className="flex items-center justify-between px-6 py-4 border-b border-border"
      style={{ background: "hsl(var(--card))", minHeight: 68 }}
    >
      <div>
        <h1
          className="text-xl font-bold leading-tight tracking-tight"
          style={{ color: "hsl(var(--foreground))" }}
          data-testid="text-page-title"
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground capitalize hidden md:block mr-1">{today}</span>

        <a
          href="#/notifications"
          className="relative inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-background hover:bg-secondary transition-colors"
          data-testid="link-notifications-topbar"
        >
          <Bell size={15} className="text-muted-foreground" />
          {unread > 0 && (
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-card"
              style={{ background: "hsl(var(--destructive))" }}
              data-testid="dot-unread"
            />
          )}
        </a>
      </div>
    </header>
  );
}
