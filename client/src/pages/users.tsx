import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import type { SafeUser, Department } from "@shared/schema";
import { Search, UserPlus } from "lucide-react";

const ROLE_LABELS: Record<string, string> = { admin: "Администратор", hr: "HR", manager: "Руководитель", employee: "Сотрудник" };
const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  admin:    { bg: "rgba(220,38,38,0.1)",   text: "#ef4444" },
  hr:       { bg: "rgba(200,168,67,0.14)", text: "hsl(43,60%,38%)" },
  manager:  { bg: "rgba(59,130,246,0.12)", text: "#3b82f6" },
  employee: { bg: "rgba(100,116,139,0.1)", text: "hsl(var(--muted-foreground))" },
};
const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  active:     { bg: "rgba(34,197,94,0.12)",  text: "#15803d",                   label: "Активен" },
  new:        { bg: "rgba(200,168,67,0.15)", text: "hsl(43,60%,38%)",           label: "Новый" },
  terminated: { bg: "rgba(220,38,38,0.1)",   text: "hsl(var(--destructive))",   label: "Уволен" },
};

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
    email: "", firstName: "", lastName: "", password: "",
    roleCode: "employee", phone: "", city: "", departmentId: "", status: "active",
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
    <div className="space-y-4 animate-page-enter">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск сотрудников..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 w-64 rounded-xl text-sm"
            data-testid="input-search-users"
          />
        </div>
        {(user.roleCode === "hr" || user.roleCode === "admin") && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5 h-9 text-sm rounded-xl" data-testid="button-add-user">
                <UserPlus size={14} /> Добавить
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">Новый сотрудник</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold mb-1.5 block">Имя</Label>
                    <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="h-10 rounded-xl" data-testid="input-firstName" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold mb-1.5 block">Фамилия</Label>
                    <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="h-10 rounded-xl" data-testid="input-lastName" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-10 rounded-xl" data-testid="input-email" />
                </div>
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">Пароль (по умолчанию: changeme123)</Label>
                  <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="h-10 rounded-xl" data-testid="input-password" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold mb-1.5 block">Роль</Label>
                    <select value={form.roleCode} onChange={(e) => setForm({ ...form, roleCode: e.target.value })}
                      className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm" data-testid="select-role">
                      <option value="employee">Сотрудник</option>
                      <option value="manager">Руководитель</option>
                      <option value="hr">HR</option>
                      {user.roleCode === "admin" && <option value="admin">Администратор</option>}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold mb-1.5 block">Отдел</Label>
                    <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                      className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm" data-testid="select-dept">
                      <option value="">—</option>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold mb-1.5 block">Телефон</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-10 rounded-xl" data-testid="input-phone" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold mb-1.5 block">Город</Label>
                    <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-10 rounded-xl" data-testid="input-city" />
                  </div>
                </div>
                <Button onClick={create} className="w-full h-10 rounded-xl font-semibold" data-testid="button-create-user">
                  Создать сотрудника
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Users table */}
      <Card style={{ boxShadow: "var(--shadow-xs)" }}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid hsl(var(--border))", background: "hsl(var(--muted)/0.5)" }}>
                  {["Сотрудник", "Email", "Отдел", "Город", "Роль", "Статус"].map((h) => (
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
                {!isLoading && users.map((u, i) => {
                  const rs = ROLE_COLORS[u.roleCode] || ROLE_COLORS.employee;
                  const ss = STATUS_STYLE[u.status] || STATUS_STYLE.active;
                  const initials = `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`;
                  return (
                    <tr key={u.id}
                      className="transition-colors hover:bg-muted/40"
                      style={{ borderBottom: i < users.length - 1 ? "1px solid hsl(var(--border))" : "none" }}
                      data-testid={`row-user-${u.id}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
                            style={{ background: "hsl(var(--muted))", color: "hsl(var(--primary))" }}
                          >
                            {initials}
                          </div>
                          <span className="font-medium" data-testid={`text-user-name-${u.id}`}>
                            {u.firstName} {u.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                      <td className="py-3 px-4">{deptName(u.departmentId ?? null)}</td>
                      <td className="py-3 px-4 text-muted-foreground">{u.city || "—"}</td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: rs.bg, color: rs.text }}>
                          {ROLE_LABELS[u.roleCode] || u.roleCode}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: ss.bg, color: ss.text }}>
                          {ss.label}
                        </span>
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
