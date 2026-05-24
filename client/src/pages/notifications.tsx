import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Notification } from "@shared/schema";

const TYPE_LABEL: Record<string, string> = {
  task: "Задача",
  document: "Документ",
  survey: "Опрос",
  event: "Событие",
  hr: "HR",
  info: "Инфо",
};

const TYPE_COLOR: Record<string, string> = {
  task: "bg-primary/15 text-primary",
  document: "bg-accent/20 text-accent-foreground",
  survey: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
  event: "bg-green-500/15 text-green-700 dark:text-green-300",
  hr: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  info: "bg-secondary text-foreground",
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const { data: items = [], isLoading } = useQuery<Notification[]>({ queryKey: ["/api/notifications"] });

  const unread = items.filter((n) => !n.isRead).length;

  async function markRead(id: number) {
    try {
      await apiRequest("PATCH", `/api/notifications/${id}/read`);
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  }

  async function markAll() {
    try {
      await apiRequest("PATCH", "/api/notifications/read-all");
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "Все уведомления прочитаны" });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Уведомления</h3>
            <div className="text-xs text-muted-foreground" data-testid="text-unread-count">
              {unread > 0 ? `Непрочитанных: ${unread}` : "Все уведомления прочитаны"}
            </div>
          </div>
          {unread > 0 && (
            <Button size="sm" variant="outline" onClick={markAll} data-testid="button-mark-all-read">
              Отметить все
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="text-xs text-muted-foreground">Загрузка...</div>
        ) : items.length === 0 ? (
          <div className="text-xs text-muted-foreground" data-testid="text-no-notifications">
            Уведомлений пока нет.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((n) => (
              <div
                key={n.id}
                className={`border rounded-md p-3 flex items-start gap-3 ${n.isRead ? "border-border opacity-70" : "border-primary/30 bg-primary/5"}`}
                data-testid={`row-notification-${n.id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLOR[n.type] ?? TYPE_COLOR.info}`}>
                      {TYPE_LABEL[n.type] ?? n.type}
                    </span>
                    {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-primary" data-testid={`dot-unread-${n.id}`} />}
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {new Date(n.createdAt).toLocaleString("ru-RU")}
                    </span>
                  </div>
                  <div className="font-medium text-sm" data-testid={`text-notification-title-${n.id}`}>{n.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">{n.message}</div>
                </div>
                {!n.isRead && (
                  <Button size="sm" variant="ghost" onClick={() => markRead(n.id)} data-testid={`button-mark-read-${n.id}`}>
                    Прочитано
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
