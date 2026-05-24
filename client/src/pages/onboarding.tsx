import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProgressItem {
  id: number;
  userId: number;
  trackId: number;
  stepId: number;
  status: "pending" | "done";
  completedAt: string | null;
  createdAt: string;
  step: { id: number; title: string; description: string | null; dueDays: number | null; position: number } | undefined;
  track: { id: number; title: string; description: string | null } | undefined;
}

export default function OnboardingPage() {
  const { toast } = useToast();
  const { data: progress = [], isLoading } = useQuery<ProgressItem[]>({ queryKey: ["/api/onboarding/my-progress"] });

  const byTrack = useMemo(() => {
    const map = new Map<number, { track: ProgressItem["track"]; items: ProgressItem[] }>();
    progress.forEach((p) => {
      if (!map.has(p.trackId)) map.set(p.trackId, { track: p.track, items: [] });
      map.get(p.trackId)!.items.push(p);
    });
    // sort steps by position
    map.forEach((v) => v.items.sort((a, b) => (a.step?.position ?? 0) - (b.step?.position ?? 0)));
    return Array.from(map.values());
  }, [progress]);

  async function toggle(item: ProgressItem) {
    try {
      await apiRequest("PATCH", `/api/onboarding/progress/${item.id}`, {
        status: item.status === "done" ? "pending" : "done",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/my-progress"] });
      toast({ title: item.status === "done" ? "Шаг возвращён" : "Шаг завершён" });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  }

  if (isLoading) {
    return (
      <Card><CardContent className="p-5 text-xs text-muted-foreground">Загрузка...</CardContent></Card>
    );
  }

  if (byTrack.length === 0) {
    return (
      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold mb-1">Адаптация</h3>
          <div className="text-xs text-muted-foreground" data-testid="text-no-onboarding">
            Вам пока не назначены треки адаптации.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {byTrack.map(({ track, items }) => {
        const done = items.filter((i) => i.status === "done").length;
        const pct = items.length ? Math.round((done / items.length) * 100) : 0;
        return (
          <Card key={track?.id ?? Math.random()}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3 gap-4">
                <div className="min-w-0">
                  <h3 className="font-semibold" data-testid={`text-track-title-${track?.id}`}>
                    {track?.title ?? "Трек адаптации"}
                  </h3>
                  {track?.description && (
                    <div className="text-xs text-muted-foreground mt-0.5">{track.description}</div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-bold" data-testid={`text-progress-${track?.id}`}>{pct}%</div>
                  <div className="text-[11px] text-muted-foreground">{done} из {items.length}</div>
                </div>
              </div>

              <div className="h-1.5 rounded-full bg-secondary overflow-hidden mb-4">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                  data-testid={`bar-progress-${track?.id}`}
                />
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="border border-border rounded-md p-3 flex items-start gap-3"
                    data-testid={`row-step-${item.id}`}
                  >
                    <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${item.status === "done" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                      {item.status === "done" ? "✓" : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${item.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                        {item.step?.title ?? "Шаг"}
                      </div>
                      {item.step?.description && (
                        <div className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">
                          {item.step.description}
                        </div>
                      )}
                      {item.completedAt && (
                        <div className="text-[10px] text-muted-foreground mt-1">
                          Выполнено: {new Date(item.completedAt).toLocaleDateString("ru-RU")}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={item.status === "done" ? "ghost" : "default"}
                      onClick={() => toggle(item)}
                      data-testid={`button-toggle-step-${item.id}`}
                    >
                      {item.status === "done" ? "Отменить" : "Готово"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
