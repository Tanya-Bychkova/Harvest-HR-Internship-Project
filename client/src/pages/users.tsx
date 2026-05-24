import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import type { SafeUser, Department } from "@shared/schema";

export default function UsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const { data: users = [], isLoading } = useQuery<SafeUser[]>({
    queryKey: ["/api/users", search],
    queryFn: async () => {
      const url = search ? `/api/users?q=${encodeURIComponent(search)}` : "/api/users";
      const res = await apiRequest("GET", url);
      return res.json();
    },
  });
  const { data: departments = [] } = useQuery<Department[]>({ queryKey: ["/api/departments"] });

  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    roleCode: "employee",
    phone: "",
    city: "",
    departmentId: "",
    status: "active",
  });

  if (!user || (user.roleCode !== "hr" && user.roleCode !== "manager" && user.roleCode !== "admin")) {
    return <div className="text-sm text-muted-foreground">Нет доступа.</div>;
  }

  async function create() {
    try {
      await apiRequest("POST", "/api/users", {
        ...form,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        dateJoined: new Date().toISOString().slice(0, 10),
      });
      toast({ title: "Сотрудник создан" });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setOpen(false);
      setForm({ ...form, email: "", firstName: "", lastName: "", password: "" });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  }

  const deptName = (id: number | null) => departments.find((d) => d.id === id)?.name || "—";

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Сотрудники</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Поиск..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
              data-testid="input-search-users"
            />
            {(user.roleCode === "hr" || user.roleCode === "admin") && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-user">+ Добавить</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Новый сотрудник</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Имя</Label>
                        <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} data-testid="input-firstName" />
                      </div>
                      <div>
                        <Label>Фамилия</Label>
                        <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} data-testid="input-lastName" />
                      </div>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="input-email" />
                    </div>
                    <div>
                      <Label>Пароль (по умолчанию: changeme123)</Label>
                      <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} data-testid="input-password" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Роль</Label>
                        <select
                          value={form.roleCode}
                          onChange={(e) => setForm({ ...form, roleCode: e.target.value })}
                          className="w-full h-9 border border-input bg-background rounded-md px-3 text-sm"
                          data-testid="select-role"
                        >
                          <option value="employee">Сотрудник</option>
                          <option value="manager">Руководитель</option>
                          <option value="hr">HR</option>
                          {user.roleCode === "admin" && <option value="admin">Администратор</option>}
                        </select>
                      </div>
                      <div>
                        <Label>Отдел</Label>
                        <select
                          value={form.departmentId}
                          onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                          className="w-full h-9 border border-input bg-background rounded-md px-3 text-sm"
                          data-testid="select-dept"
                        >
                          <option value="">—</option>
                          {departments.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Телефон</Label>
                        <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="input-phone" />
                      </div>
                      <div>
                        <Label>Город</Label>
                        <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} data-testid="input-city" />
                      </div>
                    </div>
                    <Button onClick={create} className="w-full" data-testid="button-create-user">
                      Создать сотрудника
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="py-2 px-2">ФИО</th>
                <th className="py-2 px-2">Email</th>
                <th className="py-2 px-2">Отдел</th>
                <th className="py-2 px-2">Город</th>
                <th className="py-2 px-2">Роль</th>
                <th className="py-2 px-2">Статус</th>
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
              {!isLoading &&
                users.map((u) => (
                  <tr key={u.id} className="border-b border-border hover:bg-secondary/30" data-testid={`row-user-${u.id}`}>
                    <td className="py-2.5 px-2 font-medium" data-testid={`text-user-name-${u.id}`}>
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="py-2.5 px-2 text-muted-foreground">{u.email}</td>
                    <td className="py-2.5 px-2">{deptName(u.departmentId ?? null)}</td>
                    <td className="py-2.5 px-2">{u.city || "—"}</td>
                    <td className="py-2.5 px-2 capitalize">{u.roleCode}</td>
                    <td className="py-2.5 px-2">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: u.status === "active" ? "rgba(34,197,94,0.15)" : u.status === "new" ? "rgba(200,168,67,0.18)" : "rgba(220,38,38,0.15)",
                          color: u.status === "active" ? "#16a34a" : u.status === "new" ? "hsl(var(--accent))" : "hsl(var(--destructive))",
                        }}
                      >
                        {u.status === "active" ? "Активен" : u.status === "new" ? "Новый" : "Уволен"}
                      </span>
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
