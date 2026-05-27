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
import { Plus, CheckCheck, PlayCircle, AlertCircle } from "lucide-react";

const PRIORITY_LABELS: Record<string, string> = { high: "Высокий", medium: "Средний", low: "Низкий" };
const STATUS_LABELS: Record<string, string> = { new: "Новая", in_progress: "В работе", done: "Готово", overdue: "Просрочена" };

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  done:        { bg: "rgba(34,197,94,0.12)",  text: "#15803d" },
  in_progress: { bg: "rgba(200,168,67,0.15)", text: "hsl(43,60%,38%)" },
  new:         { bg: "rgba(100,116,139,0.1)", text: "hsl(var(--muted-foreground))" },
  overdue:     { bg: "rgba(220,38,38,0.12)",  text: "hsl(var(--destructive))" },
};

const PRIORITY_STYLE: Record<string, { dot: string }> = {
  high:   { dot: "#ef4444" },
  medium: { dot: "#f59e0b" },
  low:    { dot: "#6b7280" },
};

export default function TasksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const { data: tasks = [], isLoading } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: users = [] } = useQuery<SafeUser[]>({
    queryKey: ["/api/users"],
    enabled: !!user && user.roleCode !== "employee",
  });

  const [form, setForm] = useState({ title: "", description: "", assigneeId: "", deadline: "", priority: "medium" });

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

  const openCount = tasks.filter(t => t.status === "new").length;
  const inProgressCount = tasks.filter(t => t.status === "in_progress").length;
  const doneCount = tasks.filter(t => t.status === "done").length;

  return (
    <div className="space-y-4 animate-page-enter">
      {/* Header row with summary chips */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: "Новых", count: openCount, color: "hsl(var(--muted-foreground))" },
            { label: "В работе", count: inProgressCount, color: "hsl(43,60%,38%)" },
            { label: "Готово", count: doneCount, color: "#15803d" },
          ].map(({ label, count, color }) => (
            <div
              key={label}
              className="text-xs px-3 py-1.5 rounded-full font-medium"
              style={{ background: "hsl(var(--muted))", color }}
            >
              {count} {label}
            </div>
          ))}
        </div>
        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5 h-9 text-sm rounded-xl" data-testid="button-add-task">
                <Plus size={14} /> Новая задача
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">Новая задача</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-1">
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">Название</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="h-10 rounded-xl" data-testid="input-title" />
                </div>
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">Описание</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="rounded-xl resize-none" rows={3} data-testid="input-description" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold mb-1.5 block">Исполнитель</Label>
                    <select value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
                      className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm" data-testid="select-assignee">
                      <option value="">—</option>
                      {users.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold mb-1.5 block">Приоритет</Label>
                    <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm" data-testid="select-priority">
                      <option value="high">Высокий</option>
                      <option value="medium">Средний</option>
                      <option value="low">Низкий</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">Дедлайн</Label>
                  <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className="h-10 rounded-xl" data-testid="input-deadline" />
                </div>
                <Button onClick={create} className="w-full h-10 rounded-xl font-semibold" data-testid="button-create-task">
                  Создать задачу
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Tasks table card */}
      <Card style={{ boxShadow: "var(--shadow-xs)" }}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid hsl(var(--border))", background: "hsl(var(--muted)/0.5)" }}>
                  {["Задача", "Исполнитель", "Дедлайн", "Приоритет", "Статус", "Действия"].map((h) => (
                    <th key={h} className="py-3 px-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">Загрузка...</td></tr>
                )}
                {!isLoading && tasks.length === 0 && (
                  <tr><td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">Задач нет</td></tr>
                )}
                {tasks.map((t, i) => {
                  const ss = STATUS_STYLE[t.status] || STATUS_STYLE.new;
                  const ps = PRIORITY_STYLE[t.priority] || PRIORITY_STYLE.medium;
                  return (
                    <tr
                      key={t.id}
                      className="transition-colors hover:bg-muted/40"
                      style={{ borderBottom: i < tasks.length - 1 ? "1px solid hsl(var(--border))" : "none" }}
                      data-testid={`row-task-${t.id}`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-sm" data-testid={`text-task-title-${t.id}`}>{t.title}</div>
                        {t.description && (
                          <div className="text-[11px] text-muted-foreground truncate max-w-[220px] mt-0.5">{t.description}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">{userName(t.assigneeId)}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">{t.deadline || "—"}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-sm">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ps.dot }} />
                          {PRIORITY_LABELS[t.priority] || t.priority}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: ss.bg, color: ss.text }}
                          data-testid={`status-task-${t.id}`}>
                          {STATUS_LABELS[t.status]}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {t.status !== "done" && (
                          <div className="flex items-center gap-1.5">
                            {t.status === "new" && (
                              <Button size="sm" variant="outline" onClick={() => changeStatus(t.id, "in_progress")}
                                className="h-7 text-xs rounded-lg gap-1" data-testid={`button-start-${t.id}`}>
                                <PlayCircle size={11} /> В работу
                              </Button>
                            )}
                            <Button size="sm" onClick={() => complete(t.id)}
                              className="h-7 text-xs rounded-lg gap-1" data-testid={`button-complete-${t.id}`}>
                              <CheckCheck size={11} /> Готово
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
