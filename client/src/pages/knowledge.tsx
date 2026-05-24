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
import type { KnowledgeArticle } from "@shared/schema";

export default function KnowledgePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<KnowledgeArticle | null>(null);
  const [open, setOpen] = useState(false);

  const { data: articles = [] } = useQuery<KnowledgeArticle[]>({
    queryKey: ["/api/knowledge", q],
    queryFn: async () => {
      const url = q ? `/api/knowledge?q=${encodeURIComponent(q)}` : "/api/knowledge";
      return (await apiRequest("GET", url)).json();
    },
  });

  const [form, setForm] = useState({ title: "", category: "", body: "", keywords: "" });

  const canCreate = user && (user.roleCode === "hr" || user.roleCode === "admin");

  async function create() {
    try {
      await apiRequest("POST", "/api/knowledge", form);
      toast({ title: "Статья создана" });
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge"] });
      setOpen(false);
      setForm({ title: "", category: "", body: "", keywords: "" });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-1">
        <CardContent className="p-4">
          <div className="flex gap-2 mb-3">
            <Input placeholder="Поиск..." value={q} onChange={(e) => setQ(e.target.value)} data-testid="input-search-knowledge" />
            {canCreate && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-add-article">+</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Новая статья</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Название</Label>
                      <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="input-title" />
                    </div>
                    <div>
                      <Label>Категория</Label>
                      <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} data-testid="input-category" />
                    </div>
                    <div>
                      <Label>Ключевые слова</Label>
                      <Input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} data-testid="input-keywords" />
                    </div>
                    <div>
                      <Label>Содержание</Label>
                      <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={6} data-testid="input-body" />
                    </div>
                    <Button onClick={create} className="w-full" data-testid="button-create-article">Создать</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {articles.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelected(a)}
                className={`w-full text-left p-2.5 rounded-md text-sm hover-elevate ${
                  selected?.id === a.id ? "bg-secondary" : ""
                }`}
                data-testid={`button-article-${a.id}`}
              >
                <div className="font-medium truncate">{a.title}</div>
                <div className="text-[11px] text-muted-foreground">{a.category || "Без категории"}</div>
              </button>
            ))}
            {articles.length === 0 && <div className="text-xs text-muted-foreground p-2">Статей не найдено.</div>}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardContent className="p-6">
          {selected ? (
            <>
              <div className="text-[11px] text-muted-foreground mb-1">{selected.category || "Без категории"}</div>
              <h2 className="text-xl font-bold mb-4 text-primary" data-testid="text-article-title">{selected.title}</h2>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed" data-testid="text-article-body">
                {selected.body}
              </div>
              {selected.keywords && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {selected.keywords.split(",").map((k) => (
                    <span key={k} className="text-[10px] bg-secondary px-2 py-0.5 rounded-full">{k.trim()}</span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-muted-foreground">Выберите статью слева, чтобы прочитать её.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
