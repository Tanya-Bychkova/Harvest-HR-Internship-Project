import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [edit, setEdit] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [city, setCity] = useState(user?.city || "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  async function save() {
    setSaving(true);
    try {
      const patch: any = { firstName, lastName, phone, city };
      if (password) patch.password = password;
      await apiRequest("PATCH", `/api/users/${user!.id}`, patch);
      const meRes = await apiRequest("GET", "/api/users/me");
      await meRes.json();
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      toast({ title: "Профиль обновлён" });
      setEdit(false);
      setPassword("");
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="text-xl font-bold" data-testid="text-profile-name">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-sm text-muted-foreground" data-testid="text-profile-email">{user.email}</div>
              <div className="text-xs text-muted-foreground mt-1">Дата приёма: {user.dateJoined || "—"}</div>
            </div>
            <Button variant={edit ? "outline" : "default"} onClick={() => setEdit((v) => !v)} data-testid="button-toggle-edit">
              {edit ? "Отмена" : "Редактировать"}
            </Button>
          </div>

          {edit ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Имя</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} data-testid="input-firstName" />
                </div>
                <div>
                  <Label>Фамилия</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} data-testid="input-lastName" />
                </div>
              </div>
              <div>
                <Label>Телефон</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="input-phone" />
              </div>
              <div>
                <Label>Город</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} data-testid="input-city" />
              </div>
              <div>
                <Label>Новый пароль (необязательно)</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="input-password" />
              </div>
              <Button onClick={save} disabled={saving} data-testid="button-save-profile">
                {saving ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          ) : (
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Телефон</dt>
              <dd data-testid="text-profile-phone">{user.phone || "—"}</dd>
              <dt className="text-muted-foreground">Город</dt>
              <dd>{user.city || "—"}</dd>
              <dt className="text-muted-foreground">Роль</dt>
              <dd className="capitalize">{user.roleCode}</dd>
              <dt className="text-muted-foreground">Статус</dt>
              <dd>{user.status === "active" ? "Активен" : user.status === "new" ? "Новый" : "Уволен"}</dd>
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
