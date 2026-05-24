import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Task, HrRequest, Event } from "@shared/schema";

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

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery<Stats>({ queryKey: ["/api/stats/overview"] });
  const { data: tasks = [] } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: hrRequests = [] } = useQuery<HrRequest[]>({ queryKey: ["/api/hr-requests"] });
  const { data: events = [] } = useQuery<Event[]>({ queryKey: ["/api/events"] });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";

  const cards = [
    { label: "Сотрудники", value: stats?.totalUsers, hint: `${stats?.activeUsers ?? 0} активных` },
    { label: "Задачи", value: stats?.tasksOpen, hint: `${stats?.tasksDone ?? 0} завершено` },
    { label: "Документы", value: stats?.documents, hint: "В системе" },
    { label: "Опросы", value: stats?.surveys, hint: "Активные" },
    { label: "Обращения в HR", value: stats?.hrRequestsOpen, hint: "Открытые" },
    { label: "Календарь", value: stats?.events, hint: "Предстоит" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-5">
          <div className="text-sm text-muted-foreground" data-testid="text-greeting">
            {greeting}, <span className="font-semibold text-foreground">{user?.firstName}</span>!
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Добро пожаловать в Harvest HR — внутренний портал компании Harvest Agro Holding.
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c) => (
          <Card key={c.label} data-testid={`stat-${c.label}`}>
            <CardContent className="p-4">
              <div className="text-[11px] text-muted-foreground uppercase tracking-wide">{c.label}</div>
              <div className="text-2xl font-bold text-primary mt-1" data-testid={`text-stat-${c.label}`}>
                {isLoading ? <Skeleton className="h-7 w-12" /> : c.value ?? 0}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{c.hint}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-3">Последние задачи</h3>
            {tasks.length === 0 ? (
              <div className="text-xs text-muted-foreground">Задач пока нет.</div>
            ) : (
              <ul className="space-y-2">
                {tasks.slice(0, 5).map((t) => (
                  <li key={t.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0" data-testid={`row-task-${t.id}`}>
                    <span className="truncate pr-2">{t.title}</span>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background:
                          t.status === "done"
                            ? "rgba(34,197,94,0.15)"
                            : t.status === "in_progress"
                            ? "rgba(200,168,67,0.18)"
                            : "rgba(115,115,115,0.15)",
                        color:
                          t.status === "done" ? "#16a34a" : t.status === "in_progress" ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))",
                      }}
                    >
                      {t.status === "done" ? "Готово" : t.status === "in_progress" ? "В работе" : "Новая"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-3">Ближайшие события</h3>
            {events.length === 0 ? (
              <div className="text-xs text-muted-foreground">Событий пока нет.</div>
            ) : (
              <ul className="space-y-2">
                {events.slice(0, 5).map((e) => (
                  <li key={e.id} className="text-sm py-1.5 border-b border-border last:border-0" data-testid={`row-event-${e.id}`}>
                    <div className="font-medium">{e.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(e.startsAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
                      {e.location ? ` • ${e.location}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {hrRequests.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-3">Обращения в HR</h3>
            <ul className="space-y-2">
              {hrRequests.slice(0, 5).map((r) => (
                <li key={r.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0" data-testid={`row-hrreq-${r.id}`}>
                  <span className="truncate pr-2">{r.subject}</span>
                  <span className="text-[11px] text-muted-foreground">{r.status === "closed" ? "Закрыто" : r.status === "in_progress" ? "В работе" : "Открыто"}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
