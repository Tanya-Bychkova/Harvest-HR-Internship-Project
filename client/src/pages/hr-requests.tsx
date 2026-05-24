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
import type { HrRequest, HrRequestComment } from "@shared/schema";

const CATEGORIES = ["Отпуск", "Зарплата", "Документы", "Обучение", "Жалоба", "Другое"];
const STATUS_LABELS: Record<string, string> = { open: "Открыто", in_progress: "В работе", closed: "Закрыто" };

type Detail = HrRequest & { comments: HrRequestComment[] };

export default function HrRequestsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [reply, setReply] = useState("");

  const { data: requests = [] } = useQuery<HrRequest[]>({ queryKey: ["/api/hr-requests"] });
  const { data: detail } = useQuery<Detail>({
    queryKey: ["/api/hr-requests", activeId],
    queryFn: async () => (await apiRequest("GET", `/api/hr-requests/${activeId}`)).json(),
    enabled: activeId !== null,
  });

  const [form, setForm] = useState({ subject: "", category: CATEGORIES[0], message: "" });

  async function create() {
    try {
      await apiRequest("POST", "/api/hr-requests", form);
      toast({ title: "Обращение отправлено" });
      queryClient.invalidateQueries({ queryKey: ["/api/hr-requests"] });
      setOpen(false);
      setForm({ subject: "", category: CATEGORIES[0], message: "" });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  }

  async function sendReply() {
    if (!activeId || !reply.trim()) return;
    try {
      await apiRequest("POST", `/api/hr-requests/${activeId}/comment`, { message: reply });
      setReply("");
      queryClient.invalidateQueries({ queryKey: ["/api/hr-requests", activeId] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr-requests"] });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  }

  async function closeRequest() {
    if (!activeId) return;
    try {
      await apiRequest("PATCH", `/api/hr-requests/${activeId}/close`);
      queryClient.invalidateQueries({ queryKey: ["/api/hr-requests", activeId] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr-requests"] });
      toast({ title: "Обращение закрыто" });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  }

  const canReply = user && (user.roleCode === "hr" || user.roleCode === "admin" || (detail && detail.userId === user.id));
  const canClose = user && (user.roleCode === "hr" || user.roleCode === "admin");

  if (activeId !== null && detail) {
    return (
      <Card>
        <CardContent className="p-5 max-w-2xl">
          <Button size="sm" variant="ghost" onClick={() => setActiveId(null)} className="mb-3" data-testid="button-back">
            ← Назад
          </Button>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold" data-testid="text-request-subject">{detail.subject}</h2>
              <div className="text-xs text-muted-foreground">
                {detail.category} • {STATUS_LABELS[detail.status]}
              </div>
            </div>
            {canClose && detail.status !== "closed" && (
              <Button size="sm" variant="outline" onClick={closeRequest} data-testid="button-close-request">
                Закрыть
              </Button>
            )}
          </div>
          <div className="bg-secondary/30 rounded-md p-3 text-sm mb-4 whitespace-pre-wrap">{detail.message}</div>
          <div className="space-y-2 mb-4">
            {detail.comments.map((c) => (
              <div key={c.id} className="border border-border rounded-md p-3 text-sm" data-testid={`comment-${c.id}`}>
                <div className="text-[11px] text-muted-foreground mb-1">
                  {new Date(c.createdAt).toLocaleString("ru-RU")}
                </div>
                <div className="whitespace-pre-wrap">{c.message}</div>
              </div>
            ))}
          </div>
          {canReply && detail.status !== "closed" && (
            <div className="space-y-2">
              <Textarea placeholder="Ваш ответ..." value={reply} onChange={(e) => setReply(e.target.value)} data-testid="input-reply" />
              <Button onClick={sendReply} data-testid="button-send-reply">Отправить</Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Обращения в HR</h3>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-request">+ Новое обращение</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Новое обращение</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Тема</Label>
                  <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} data-testid="input-subject" />
                </div>
                <div>
                  <Label>Категория</Label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full h-9 border border-input bg-background rounded-md px-3 text-sm"
                    data-testid="select-category"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Сообщение</Label>
                  <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={6} data-testid="input-message" />
                </div>
                <Button onClick={create} className="w-full" data-testid="button-create-request">Отправить</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {requests.length === 0 ? (
          <div className="text-xs text-muted-foreground">Обращений нет.</div>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveId(r.id)}
                className="w-full text-left border border-border rounded-md p-3 hover-elevate"
                data-testid={`row-request-${r.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{r.subject}</div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary">
                    {STATUS_LABELS[r.status]}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {r.category} • {new Date(r.createdAt).toLocaleDateString("ru-RU")}
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
