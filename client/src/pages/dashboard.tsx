import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Task, HrRequest, Event } from "@shared/schema";
import {
  Users, CheckSquare, FileText, ClipboardList,
  MessageSquare, CalendarDays, TrendingUp, Clock
} from "lucide-react";

interface Stats {
  totalUsers: number;
  activeUsers: number;
  tasksTotal: number;
  tasksDone: number;
  tasksOpen: number;
  documents: number;
  surveys: number;
  hrRequestsOpen: number;
  events: number;
  myRole: string;
}

const STATUS_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  done: { bg: "rgba(34,197,94,0.12)", text: "#16a34a", label: "Готово" },
  in_progress: { bg: "rgba(200,168,67,0.15)", text: "hsl(43,65%,42%)", label: "В работе" },
  new: { bg: "rgba(100,116,139,0.12)", text: "hsl(var(--muted-foreground))", label: "Новая" },
  overdue: { bg: "rgba(220,38,38,0.12)", text: "hsl(var(--destructive))", label: "Просрочена" },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery<Stats>({ queryKey: ["/api/stats/overview"] });
  const { data: tasks = [] } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: hrRequests = [] } = useQuery<HrRequest[]>({ queryKey: ["/api/hr-requests"] });
  const { data: events = [] } = useQuery<Event[]>({ queryKey: ["/api/events"] });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";

  const statCards = [
    { label: "Сотрудники", value: stats?.totalUsers, hint: `${stats?.activeUsers ?? 0} активных`, icon: Users, color: "hsl(var(--primary))" },
    { label: "Задачи", value: stats?.tasksOpen, hint: `${stats?.tasksDone ?? 0} завершено`, icon: CheckSquare, color: "hsl(43,65%,42%)" },
    { label: "Документы", value: stats?.documents, hint: "В системе", icon: FileText, color: "hsl(200,52%,40%)" },
    { label: "Опросы", value: stats?.surveys, hint: "Активные", icon: ClipboardList, color: "hsl(110,32%,38%)" },
    { label: "Обращения в HR", value: stats?.hrRequestsOpen, hint: "Открытые", icon: MessageSquare, color: "hsl(25,72%,46%)" },
    { label: "Календарь", value: stats?.events, hint: "Предстоит", icon: CalendarDays, color: "hsl(var(--primary))" },
  ];

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Welcome banner */}
      <div
        className="rounded-xl px-6 py-5 flex items-center justify-between"
        style={{
          background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(148,38%,28%) 100%)",
          color: "hsl(var(--primary-foreground))",
        }}
      >
        <div>
          <p className="text-sm opacity-75" data-testid="text-greeting">
            {greeting}, <span className="font-semibold opacity-100">{user?.firstName}</span>
          </p>
          <h2 className="text-2xl font-bold mt-0.5" style={{ letterSpacing: "-0.02em" }}>
            Добро пожаловать в Harvest HR
          </h2>
          <p className="text-sm opacity-60 mt-1">Внутренний портал Harvest Agro Holding</p>
        </div>
        <div
          className="hidden md:flex w-16 h-16 rounded-2xl items-center justify-center opacity-20"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          <TrendingUp size={32} />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="stat-card-bar" data-testid={`stat-${c.label}`} style={{ boxShadow: "var(--shadow-xs)" }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center"
                    style={{ background: `${c.color}18`, color: c.color }}
                  >
                    <Icon size={14} />
                  </div>
                </div>
                <div className="text-2xl font-bold mt-1" style={{ color: c.color }} data-testid={`text-stat-${c.label}`}>
                  {isLoading ? <Skeleton className="h-7 w-10" /> : c.value ?? 0}
                </div>
                <div className="text-[11px] font-medium text-foreground mt-0.5">{c.label}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{c.hint}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent tasks */}
        <Card style={{ boxShadow: "var(--shadow-xs)" }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ background: "rgba(43,90,43,0.1)", color: "hsl(var(--primary))" }}
              >
                <CheckSquare size={13} />
              </div>
              <h3 className="font-semibold text-sm">Последние задачи</h3>
            </div>
            {tasks.length === 0 ? (
              <div className="text-xs text-muted-foreground py-4 text-center">Задач пока нет</div>
            ) : (
              <ul className="space-y-1">
                {tasks.slice(0, 5).map((t) => {
                  const s = STATUS_COLOR[t.status] || STATUS_COLOR.new;
                  return (
                    <li
                      key={t.id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary/50 transition-colors"
                      data-testid={`row-task-${t.id}`}
                    >
                      <span className="truncate pr-2 text-sm">{t.title}</span>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: s.bg, color: s.text }}
                      >
                        {s.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Upcoming events */}
        <Card style={{ boxShadow: "var(--shadow-xs)" }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ background: "rgba(200,168,67,0.12)", color: "hsl(43,65%,42%)" }}
              >
                <CalendarDays size={13} />
              </div>
              <h3 className="font-semibold text-sm">Ближайшие события</h3>
            </div>
            {events.length === 0 ? (
              <div className="text-xs text-muted-foreground py-4 text-center">Событий пока нет</div>
            ) : (
              <ul className="space-y-1">
                {events.slice(0, 5).map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-secondary/50 transition-colors"
                    data-testid={`row-event-${e.id}`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex flex-col items-center justify-center shrink-0 text-center"
                      style={{ background: "hsl(var(--muted))" }}
                    >
                      <span className="text-[9px] font-bold uppercase leading-none" style={{ color: "hsl(var(--primary))" }}>
                        {new Date(e.startsAt).toLocaleDateString("ru-RU", { month: "short" })}
                      </span>
                      <span className="text-sm font-bold leading-none" style={{ color: "hsl(var(--foreground))" }}>
                        {new Date(e.startsAt).getDate()}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium leading-tight">{e.title}</div>
                      {e.location && <div className="text-[11px] text-muted-foreground mt-0.5">{e.location}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* HR Requests */}
      {hrRequests.length > 0 && (
        <Card style={{ boxShadow: "var(--shadow-xs)" }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ background: "rgba(25,72,120,0.1)", color: "hsl(200,52%,40%)" }}
              >
                <MessageSquare size={13} />
              </div>
              <h3 className="font-semibold text-sm">Обращения в HR</h3>
            </div>
            <ul className="space-y-1">
              {hrRequests.slice(0, 5).map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary/50 transition-colors text-sm"
                  data-testid={`row-hrreq-${r.id}`}
                >
                  <span className="truncate pr-2">{r.subject}</span>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {r.status === "closed" ? "Закрыто" : r.status === "in_progress" ? "В работе" : "Открыто"}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
