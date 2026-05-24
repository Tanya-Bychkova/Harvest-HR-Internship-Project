import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import type { Task, SafeUser } from "@shared/schema";

const PRIORITY_LABELS: Record<string, string> = { high: "Высокий", medium: "Средний", low: "Низкий" };
const STATUS_LABELS: Record<string, string> = { new: "Новая", in_progress: "В работе", done: "Готово", overdue: "Просрочена" };

export default function TasksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const { data: tasks = [], isLoading } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: users = [] } = useQuery<SafeUser[]>({
    queryKey: ["/api/users"],
    enabled: !!user && user.roleCode !== "employee",
  });

  const [form, setForm] = useState({
    title: "",
    description: "",
    assigneeId: "",
    deadline: "",
    priority: "medium",
  });

  const canCreate = user && (user.roleCode === "hr" || user.roleCode === "manager" || user.roleCode === "admin");

  async function create() {
    try {
      await apiRequest("POST", "/api/tasks", {
        title: form.title,
        description: form.description || null,
        assigneeId: form.assigneeId ? Number(form.assigneeId) : null,
        deadline: form.deadline || null,
        priority: form.priority,
        status: "new",
        creatorId: user!.id,
      });
      toast({ title: "Задача создана" });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      setOpen(false);
      setForm({ title: "", description: "", assigneeId: "", deadline: "", priority: "medium" });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  }

  async function changeStatus(id: number, status: string) {
    await apiRequest("PATCH", `/api/tasks/${id}`, { status });
    queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
  }

  async function complete(id: number) {
    await apiRequest("PATCH", `/api/tasks/${id}/complete`);
    queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    queryClient.invalidateQueries({ queryKey: ["/api/stats/overview"] });
    toast({ title: "Задача выполнена" });
  }

  const userName = (id: number | null) => {
    if (!id) return "—";
    const u = users.find((x) => x.id === id);
    return u ? `${u.firstName} ${u.lastName}` : `#${id}`;
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{user?.roleCode === "employee" ? "Мои задачи" : "Все задачи"}</h3>
          {canCreate && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-task">+ Новая задача</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Новая задача</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Название</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="input-title" />
                  </div>
                  <div>
                    <Label>Описание</Label>
                    <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="input-description" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Исполнитель</Label>
                      <select
                        value={form.assigneeId}
                        onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
                        className="w-full h-9 border border-input bg-background rounded-md px-3 text-sm"
                        data-testid="select-assignee"
                      >
                        <option value="">—</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.firstName} {u.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Приоритет</Label>
                      <select
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                        className="w-full h-9 border border-input bg-background rounded-md px-3 text-sm"
                        data-testid="select-priority"
                      >
                        <option value="high">Высокий</option>
                        <option value="medium">Средний</option>
                        <option value="low">Низкий</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label>Дедлайн</Label>
                    <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} data-testid="input-deadline" />
                  </div>
                  <Button onClick={create} className="w-full" data-testid="button-create-task">
                    Создать задачу
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="py-2 px-2">Задача</th>
                <th className="py-2 px-2">Исполнитель</th>
                <th className="py-2 px-2">Дедлайн</th>
                <th className="py-2 px-2">Приоритет</th>
                <th className="py-2 px-2">Статус</th>
                <th className="py-2 px-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-muted-foreground">
                    Загрузка...
                  </td>
                </tr>
              )}
              {!isLoading && tasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-muted-foreground">
                    Задач нет.
                  </td>
                </tr>
              )}
              {tasks.map((t) => (
                <tr key={t.id} className="border-b border-border" data-testid={`row-task-${t.id}`}>
                  <td className="py-2.5 px-2">
                    <div className="font-medium" data-testid={`text-task-title-${t.id}`}>{t.title}</div>
                    {t.description && <div className="text-[11px] text-muted-foreground truncate max-w-xs">{t.description}</div>}
                  </td>
                  <td className="py-2.5 px-2">{userName(t.assigneeId)}</td>
                  <td className="py-2.5 px-2">{t.deadline || "—"}</td>
                  <td className="py-2.5 px-2">{PRIORITY_LABELS[t.priority] || t.priority}</td>
                  <td className="py-2.5 px-2">
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: t.status === "done" ? "rgba(34,197,94,0.15)" : t.status === "in_progress" ? "rgba(200,168,67,0.18)" : "rgba(115,115,115,0.15)",
                        color: t.status === "done" ? "#16a34a" : t.status === "in_progress" ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))",
                      }}
                      data-testid={`status-task-${t.id}`}
                    >
                      {STATUS_LABELS[t.status]}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 space-x-2">
                    {t.status !== "done" && (
                      <>
                        {t.status === "new" && (
                          <Button size="sm" variant="outline" onClick={() => changeStatus(t.id, "in_progress")} data-testid={`button-start-${t.id}`}>
                            В работу
                          </Button>
                        )}
                        <Button size="sm" onClick={() => complete(t.id)} data-testid={`button-complete-${t.id}`}>
                          Готово
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
