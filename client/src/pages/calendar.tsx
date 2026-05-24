import { useMemo, useState } from "react";
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
import type { Event } from "@shared/schema";

function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }
function formatDateInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    startsAt: formatDateInput(new Date(Date.now() + 60 * 60 * 1000)),
    endsAt: "",
    location: "",
    link: "",
  });

  const { data: events = [], isLoading } = useQuery<Event[]>({ queryKey: ["/api/events"] });

  const canManage = user && (user.roleCode === "hr" || user.roleCode === "admin" || user.roleCode === "manager");

  const grouped = useMemo(() => {
    const map = new Map<string, Event[]>();
    [...events]
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      .forEach((e) => {
        const day = e.startsAt.slice(0, 10);
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(e);
      });
    return Array.from(map.entries());
  }, [events]);

  async function create() {
    try {
      const payload: any = {
        title: form.title,
        description: form.description || null,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        location: form.location || null,
        link: form.link || null,
      };
      await apiRequest("POST", "/api/events", payload);
      toast({ title: "Событие создано" });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/overview"] });
      setOpen(false);
      setForm({
        title: "",
        description: "",
        startsAt: formatDateInput(new Date(Date.now() + 60 * 60 * 1000)),
        endsAt: "",
        location: "",
        link: "",
      });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  }

  async function remove(id: number) {
    try {
      await apiRequest("DELETE", `/api/events/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Событие удалено" });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Календарь событий</h3>
            <div className="text-xs text-muted-foreground">Совещания, тренинги и корпоративные события</div>
          </div>
          {canManage && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-event">+ Новое событие</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Новое событие</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Название</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="input-event-title" />
                  </div>
                  <div>
                    <Label>Описание</Label>
                    <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="input-event-description" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Начало</Label>
                      <Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} data-testid="input-event-starts" />
                    </div>
                    <div>
                      <Label>Окончание</Label>
                      <Input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} data-testid="input-event-ends" />
                    </div>
                  </div>
                  <div>
                    <Label>Место</Label>
                    <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Переговорная / онлайн" data-testid="input-event-location" />
                  </div>
                  <div>
                    <Label>Ссылка</Label>
                    <Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://..." data-testid="input-event-link" />
                  </div>
                  <Button onClick={create} className="w-full" data-testid="button-create-event">Создать</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="text-xs text-muted-foreground">Загрузка...</div>
        ) : grouped.length === 0 ? (
          <div className="text-xs text-muted-foreground" data-testid="text-no-events">Событий нет.</div>
        ) : (
          <div className="space-y-5">
            {grouped.map(([day, items]) => (
              <div key={day}>
                <div className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground mb-2">
                  {new Date(day).toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "long" })}
                </div>
                <div className="space-y-2">
                  {items.map((e) => (
                    <div
                      key={e.id}
                      className="border border-border rounded-md p-3 flex items-start justify-between gap-3"
                      data-testid={`row-event-${e.id}`}
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-sm" data-testid={`text-event-title-${e.id}`}>{e.title}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {new Date(e.startsAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                          {e.endsAt && ` – ${new Date(e.endsAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`}
                          {e.location && ` • ${e.location}`}
                        </div>
                        {e.description && (
                          <div className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{e.description}</div>
                        )}
                        {e.link && (
                          <a href={e.link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline mt-1 inline-block">
                            Открыть ссылку →
                          </a>
                        )}
                      </div>
                      {canManage && (
                        <Button size="sm" variant="ghost" onClick={() => remove(e.id)} data-testid={`button-delete-event-${e.id}`}>
                          Удалить
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
