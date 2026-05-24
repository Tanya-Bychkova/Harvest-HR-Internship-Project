import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { HarvestLogo } from "@/components/HarvestLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEPARTMENTS = [
  "HR-отдел",
  "IT-отдел",
  "Финансовый отдел",
  "Юридический отдел",
  "Маркетинг",
  "Бухгалтерия",
  "Операционный отдел",
  "Агрономия",
  "Логистика",
  "Безопасность",
];
const CITIES = [
  "Астана",
  "Алматы",
  "Костанай",
  "Павлодар",
  "Петропавловск",
  "Актобе",
  "Семей",
  "Усть-Каменогорск",
  "Тараз",
  "Кызылорда",
];

export default function LoginPage() {
  const { login, register, loading } = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("hr@harvest.kz");
  const [password, setPassword] = useState("hr123");

  // register state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [city, setCity] = useState(CITIES[0]);
  const [phone, setPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");

  async function doLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Ошибка входа");
    }
  }

  async function doRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (regPassword.length < 6) {
      setError("Пароль должен быть не короче 6 символов");
      return;
    }
    try {
      await register({
        email: regEmail,
        password: regPassword,
        firstName,
        lastName,
        phone,
        city,
        department,
        position,
      });
    } catch (err: any) {
      setError(err.message || "Ошибка регистрации");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "linear-gradient(160deg, #0d1a0d 0%, #111a11 50%, #1a2a10 100%)" }}
    >
      <div className="w-full max-w-md bg-card rounded-2xl p-10 shadow-2xl">
        <div className="text-center mb-7">
          <div className="text-primary inline-block">
            <HarvestLogo />
          </div>
          <h2 className="text-xl font-bold mt-3" style={{ color: "hsl(var(--accent))" }}>
            Harvest HR
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Внутренняя платформа Harvest Agro Holding</p>
        </div>

        <div className="flex border border-border rounded-lg overflow-hidden mb-6">
          <button
            onClick={() => {
              setTab("login");
              setError(null);
            }}
            className={`flex-1 py-2.5 text-sm font-medium transition ${
              tab === "login" ? "bg-primary text-primary-foreground" : "bg-background text-foreground"
            }`}
            data-testid="tab-login"
          >
            Войти
          </button>
          <button
            onClick={() => {
              setTab("register");
              setError(null);
            }}
            className={`flex-1 py-2.5 text-sm font-medium transition ${
              tab === "register" ? "bg-primary text-primary-foreground" : "bg-background text-foreground"
            }`}
            data-testid="tab-register"
          >
            Регистрация
          </button>
        </div>

        {error && (
          <div
            className="text-sm px-3 py-2 rounded-md mb-4"
            style={{ background: "rgba(220,38,38,0.1)", color: "hsl(var(--destructive))", border: "1px solid rgba(220,38,38,0.3)" }}
            data-testid="text-error"
          >
            {error}
          </div>
        )}

        {tab === "login" ? (
          <form onSubmit={doLogin} className="space-y-4">
            <div>
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@harvest.kz"
                required
                data-testid="input-email"
              />
            </div>
            <div>
              <Label htmlFor="login-password">Пароль</Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                data-testid="input-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={loading}
              data-testid="button-login"
            >
              {loading ? "Вход..." : "Войти в систему"}
            </Button>
            <div className="text-xs text-muted-foreground bg-secondary/30 rounded-md p-3 mt-4">
              <div className="font-semibold mb-1">Демо-аккаунты:</div>
              <div>admin@harvest.kz / admin123</div>
              <div>hr@harvest.kz / hr123</div>
              <div>manager@harvest.kz / manager123</div>
              <div>employee@harvest.kz / employee123</div>
            </div>
          </form>
        ) : (
          <form onSubmit={doRegister} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Имя</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required data-testid="input-firstName" />
              </div>
              <div>
                <Label>Фамилия</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required data-testid="input-lastName" />
              </div>
            </div>
            <div>
              <Label>Email (корпоративный)</Label>
              <Input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required data-testid="input-regEmail" />
            </div>
            <div>
              <Label>Должность</Label>
              <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="HR-менеджер" data-testid="input-position" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Отдел</Label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  data-testid="select-department"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Город</Label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  data-testid="select-city"
                >
                  {CITIES.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label>Телефон</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="8 701 234 5678" data-testid="input-phone" />
            </div>
            <div>
              <Label>Пароль</Label>
              <Input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required data-testid="input-regPassword" />
            </div>
            <Button type="submit" className="w-full" disabled={loading} data-testid="button-register">
              {loading ? "Создание..." : "Создать аккаунт"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
