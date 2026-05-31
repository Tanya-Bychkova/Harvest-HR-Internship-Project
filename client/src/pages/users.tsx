import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import type { SafeUser, Department } from "@shared/schema";
import { Search, UserPlus, Pencil, Trash2 } from "lucide-react";

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

const emptyForm = {
  email: "", firstName: "", lastName: "", password: "",
  roleCode: "employee", phone: "", city: "", departmentId: "", status: "active",
};

export default function UsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<SafeUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<SafeUser | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [editForm, setEditForm] = useState({ ...emptyForm });

  const { data: users = [], isLoading } = useQuery<SafeUser[]>({
    queryKey: ["/api/users", search],
    queryFn: async () => {
      const url = search ? `/api/users?q=${encodeURIComponent(search)}` : "/api/users";
      const res = await apiRequest("GET", url);
      return res.json();
    },
  });
  const { data: departments = [] } = useQuery<Department[]>({ queryKey: ["/api/departments"] });

  if (!user || (user.roleCode !== "hr" && user.roleCode !== "manager" && user.roleCode !== "admin")) {
    return <div className="text-sm text-muted-foreground">Нет доступа.</div>;
  }

  const isAdminOrHr = user.roleCode === "hr" || user.roleCode === "admin";

  async function create() {
    try {
      await apiRequest("POST", "/api/users", {
        ...form,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        dateJoined: new Date().toISOString().slice(0, 10),
      });
      toast({ title: "Сотрудник создан" });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setCreateOpen(false);
      setForm({ ...emptyForm });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  }

  function openEdit(u: SafeUser) {
    setEditForm({
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      password: "",
      roleCode: u.roleCode,
      phone: u.phone || "",
      city: u.city || "",
      departmentId: u.departmentId ? String(u.departmentId) : "",
      status: u.status,
    });
    setEditUser(u);
  }

  async function saveEdit() {
    if (!editUser) return;
    try {
      const patch: any = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        roleCode: editForm.roleCode,
        phone: editForm.phone || null,
        city: editForm.city || null,
        departmentId: editForm.departmentId ? Number(editForm.departmentId) : null,
        status: editForm.status,
      };
      if (editForm.password) patch.password = editForm.password;
      await apiRequest("PATCH", `/api/users/${editUser.id}`, patch);
      toast({ title: "Изменения сохранены" });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditUser(null);
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  }

  async function confirmDelete() {
    if (!deleteUser) return;
    try {
      await apiRequest("DELETE", `/api/users/${deleteUser.id}`);
      toast({ title: "Сотрудник удалён" });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setDeleteUser(null);
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  }

  const deptName = (id: number | null) => departments.find((d) => d.id === id)?.name || "—";

  const UserFormFields = ({ f, setF, showPassword }: { f: typeof emptyForm; setF: (v: typeof emptyForm) => void; showPassword: boolean }) => (
    <div className="space-y-3 mt-1">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold mb-1.5 block">Имя</Label>
          <Input value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} className="h-10 rounded-xl" />
        </div>
        <div>
          <Label className="text-xs font-semibold mb-1.5 block">Фамилия</Label>
          <Input value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} className="h-10 rounded-xl" />
        </div>
      </div>
      <div>
        <Label className="text-xs font-semibold mb-1.5 block">Email</Label>
        <Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="h-10 rounded-xl" />
      </div>
      <div>
        <Label className="text-xs font-semibold mb-1.5 block">{showPassword ? "Новый пароль (оставьте пустым, чтобы не менять)" : "Пароль"}</Label>
        <Input value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className="h-10 rounded-xl" placeholder={showPassword ? "••••••••" : ""} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold mb-1.5 block">Роль</Label>
          <select value={f.roleCode} onChange={(e) => setF({ ...f, roleCode: e.target.value })}
            className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm">
            <option value="employee">Сотрудник</option>
            <option value="manager">Руководитель</option>
            <option value="hr">HR</option>
            {user.roleCode === "admin" && <option value="admin">Администратор</option>}
          </select>
        </div>
        <div>
          <Label className="text-xs font-semibold mb-1.5 block">Статус</Label>
          <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}
            className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm">
            <option value="active">Активен</option>
            <option value="new">Новый</option>
            <option value="terminated">Уволен</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold mb-1.5 block">Отдел</Label>
          <select value={f.departmentId} onChange={(e) => setF({ ...f, departmentId: e.target.value })}
            className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm">
            <option value="">—</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <Label className="text-xs font-semibold mb-1.5 block">Город</Label>
          <Input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} className="h-10 rounded-xl" />
        </div>
      </div>
      <div>
        <Label className="text-xs font-semibold mb-1.5 block">Телефон</Label>
        <Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className="h-10 rounded-xl" />
      </div>
    </div>
  );

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
          />
        </div>
        {isAdminOrHr && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5 h-9 text-sm rounded-xl">
                <UserPlus size={14} /> Добавить
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">Новый сотрудник</DialogTitle>
              </DialogHeader>
              <UserFormFields f={form} setF={setForm} showPassword={false} />
              <Button onClick={create} className="w-full h-10 rounded-xl font-semibold mt-2">
                Создать сотрудника
              </Button>
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
                  {["Сотрудник", "Email", "Отдел", "Город", "Роль", "Статус", ...(isAdminOrHr ? [""] : [])].map((h, i) => (
                    <th key={i} className="py-3 px-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">Загрузка...</td></tr>
                )}
                {!isLoading && users.map((u, i) => {
                  const rs = ROLE_COLORS[u.roleCode] || ROLE_COLORS.employee;
                  const ss = STATUS_STYLE[u.status] || STATUS_STYLE.active;
                  const initials = `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`;
                  return (
                    <tr key={u.id}
                      className="transition-colors hover:bg-muted/40"
                      style={{ borderBottom: i < users.length - 1 ? "1px solid hsl(var(--border))" : "none" }}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
                            style={{ background: "hsl(var(--muted))", color: "hsl(var(--primary))" }}
                          >
                            {initials}
                          </div>
                          <span className="font-medium">{u.firstName} {u.lastName}</span>
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
                      {isAdminOrHr && (
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 rounded-lg hover:bg-muted"
                              onClick={() => openEdit(u)}
                              title="Редактировать"
                            >
                              <Pencil size={13} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => setDeleteUser(u)}
                              title="Удалить"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Редактировать: {editUser?.firstName} {editUser?.lastName}
            </DialogTitle>
          </DialogHeader>
          <UserFormFields f={editForm} setF={setEditForm} showPassword={true} />
          <Button onClick={saveEdit} className="w-full h-10 rounded-xl font-semibold mt-2">
            Сохранить изменения
          </Button>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={(o) => !o && setDeleteUser(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить сотрудника?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить <strong>{deleteUser?.firstName} {deleteUser?.lastName}</strong>? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="rounded-xl bg-destructive hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
