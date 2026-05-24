import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import type { Document, DocumentAssignment, SafeUser } from "@shared/schema";

type DocWithAssignment = Document & { assignment?: DocumentAssignment };

export default function DocumentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [assignDocId, setAssignDocId] = useState<number | null>(null);

  const { data: docs = [], isLoading } = useQuery<DocWithAssignment[]>({ queryKey: ["/api/documents"] });
  const { data: users = [] } = useQuery<SafeUser[]>({
    queryKey: ["/api/users"],
    enabled: !!user && (user.roleCode === "hr" || user.roleCode === "admin"),
  });

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    filePath: "",
    isConfirmationRequired: false,
  });
  const [selected, setSelected] = useState<number[]>([]);

  const canCreate = user && (user.roleCode === "hr" || user.roleCode === "admin");

  async function create() {
    try {
      await apiRequest("POST", "/api/documents", form);
      toast({ title: "Документ загружен" });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setOpen(false);
      setForm({ title: "", description: "", category: "", filePath: "", isConfirmationRequired: false });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  }

  async function confirm(docId: number) {
    try {
      await apiRequest("PATCH", `/api/documents/${docId}/confirm`);
      toast({ title: "Ознакомление подтверждено" });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  }

  async function assign() {
    if (!assignDocId || selected.length === 0) return;
    try {
      await apiRequest("POST", `/api/documents/${assignDocId}/assign`, { userIds: selected });
      toast({ title: "Документ назначен" });
      setAssignDocId(null);
      setSelected([]);
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Документы</h3>
            {canCreate && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-document">+ Загрузить документ</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Новый документ</DialogTitle>
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
                      <Label>Описание</Label>
                      <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="input-description" />
                    </div>
                    <div>
                      <Label>Путь к файлу / ссылка</Label>
                      <Input value={form.filePath} onChange={(e) => setForm({ ...form, filePath: e.target.value })} data-testid="input-filePath" />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.isConfirmationRequired}
                        onCheckedChange={(v) => setForm({ ...form, isConfirmationRequired: !!v })}
                        data-testid="checkbox-confirmation"
                      />
                      Требуется подтверждение ознакомления
                    </label>
                    <Button onClick={create} className="w-full" data-testid="button-create-document">
                      Загрузить
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          {isLoading ? (
            <div className="text-xs text-muted-foreground">Загрузка...</div>
          ) : docs.length === 0 ? (
            <div className="text-xs text-muted-foreground">Документов нет.</div>
          ) : (
            <div className="space-y-2">
              {docs.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between border border-border rounded-md p-3"
                  data-testid={`row-document-${d.id}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate" data-testid={`text-document-title-${d.id}`}>
                      {d.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {d.category || "Без категории"} {d.isConfirmationRequired && "• Требует подтверждения"}
                    </div>
                    {d.description && <div className="text-xs text-muted-foreground mt-1">{d.description}</div>}
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    {d.assignment && d.assignment.status === "confirmed" ? (
                      <span className="text-xs text-green-600 font-semibold" data-testid={`status-document-${d.id}`}>Ознакомлен</span>
                    ) : d.assignment && d.isConfirmationRequired ? (
                      <Button size="sm" onClick={() => confirm(d.id)} data-testid={`button-confirm-${d.id}`}>
                        Подтвердить
                      </Button>
                    ) : null}
                    {canCreate && (
                      <Button size="sm" variant="outline" onClick={() => { setAssignDocId(d.id); setSelected([]); }} data-testid={`button-assign-${d.id}`}>
                        Назначить
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={assignDocId !== null} onOpenChange={() => setAssignDocId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Назначить сотрудникам</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {users.map((u) => (
              <label key={u.id} className="flex items-center gap-2 text-sm py-1">
                <Checkbox
                  checked={selected.includes(u.id)}
                  onCheckedChange={(v) => {
                    setSelected((s) => (v ? [...s, u.id] : s.filter((x) => x !== u.id)));
                  }}
                  data-testid={`checkbox-user-${u.id}`}
                />
                {u.firstName} {u.lastName} <span className="text-muted-foreground">({u.email})</span>
              </label>
            ))}
          </div>
          <Button onClick={assign} disabled={selected.length === 0} data-testid="button-do-assign">
            Назначить ({selected.length})
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
