import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { HarvestLogo } from "@/components/HarvestLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEPARTMENTS = [
  "HR-отдел", "IT-отдел", "Финансовый отдел", "Юридический отдел",
  "Маркетинг", "Бухгалтерия", "Операционный отдел", "Агрономия", "Логистика", "Безопасность",
];
const CITIES = [
  "Астана", "Алматы", "Костанай", "Павлодар", "Петропавловск",
  "Актобе", "Семей", "Усть-Каменогорск", "Тараз", "Кызылорда",
];

export default function LoginPage() {
  const { login, register, loading } = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("hr@harvest.kz");
  const [password, setPassword] = useState("hr123");

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
    try { await login(email, password); }
    catch (err: any) { setError(err.message || "Ошибка входа"); }
  }

  async function doRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (regPassword.length < 6) { setError("Пароль должен быть не короче 6 символов"); return; }
    try {
      await register({ email: regEmail, password: regPassword, firstName, lastName, phone, city, department, position });
    } catch (err: any) { setError(err.message || "Ошибка регистрации"); }
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "hsl(var(--background))" }}
    >
      {/* Left decorative panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[42%] p-12"
        style={{
          background: "linear-gradient(160deg, #003050 0%, #003B63 60%, #004A7A 100%)",
        }}
      >
        <div style={{ color: "#DDB12C" }}>
          <HarvestLogo />
        </div>
        <div>
          <blockquote
            className="text-3xl font-bold leading-snug"
            style={{ fontFamily: "var(--font-serif)", color: "hsl(55,35%,90%)", letterSpacing: "-0.02em" }}
          >
            Люди — главный ресурс Harvest Agro
          </blockquote>
          <p className="mt-4 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            Внутренняя HR-платформа для управления командой, задачами и корпоративными знаниями.
          </p>
        </div>
        <div className="flex gap-6">
          {["Сотрудники", "Задачи", "Курсы"].map((label) => (
            <div key={label}>
              <div className="text-2xl font-bold" style={{ color: "#DDB12C" }}>—</div>
              <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <HarvestLogo variant="dark" />
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ letterSpacing: "-0.02em" }}>
            {tab === "login" ? "Войти в платформу" : "Создать аккаунт"}
          </h2>
          <p className="text-sm text-muted-foreground mb-7">
            {tab === "login" ? "Введите рабочий email и пароль" : "Заполните данные для регистрации"}
          </p>

          {/* Tabs */}
          <div
            className="flex p-1 rounded-xl mb-6"
            style={{ background: "hsl(var(--muted))" }}
          >
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); }}
                className="flex-1 py-2 text-sm font-medium rounded-lg transition-all"
                style={{
                  background: tab === t ? "hsl(var(--card))" : "transparent",
                  color: tab === t ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                  boxShadow: tab === t ? "var(--shadow-xs)" : "none",
                }}
                data-testid={`tab-${t}`}
              >
                {t === "login" ? "Войти" : "Регистрация"}
              </button>
            ))}
          </div>

          {error && (
            <div
              className="text-sm px-4 py-3 rounded-xl mb-5"
              style={{ background: "rgba(220,38,38,0.08)", color: "hsl(var(--destructive))", border: "1px solid rgba(220,38,38,0.2)" }}
              data-testid="text-error"
            >
              {error}
            </div>
          )}

          {tab === "login" ? (
            <form onSubmit={doLogin} className="space-y-4">
              <div>
                <Label htmlFor="login-email" className="text-xs font-semibold mb-1.5 block">Email</Label>
                <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@harvest.kz" required data-testid="input-email"
                  className="h-10 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="login-password" className="text-xs font-semibold mb-1.5 block">Пароль</Label>
                <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required data-testid="input-password"
                  className="h-10 rounded-xl" />
              </div>
              <Button type="submit" className="w-full h-10 rounded-xl font-semibold" disabled={loading} data-testid="button-login">
                {loading ? "Вход..." : "Войти в систему"}
              </Button>
              <div
                className="text-xs rounded-xl p-4 mt-2 space-y-1"
                style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
              >
                <div className="font-semibold text-foreground mb-2">Демо-аккаунты</div>
                {["admin@harvest.kz / admin123", "hr@harvest.kz / hr123", "manager@harvest.kz / manager123", "employee@harvest.kz / employee123"].map(a => (
                  <div key={a} className="font-mono text-[11px]">{a}</div>
                ))}
              </div>
            </form>
          ) : (
            <form onSubmit={doRegister} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">Имя</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required data-testid="input-firstName" className="h-10 rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">Фамилия</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required data-testid="input-lastName" className="h-10 rounded-xl" />
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Email (корпоративный)</Label>
                <Input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required data-testid="input-regEmail" className="h-10 rounded-xl" />
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Должность</Label>
                <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="HR-менеджер" data-testid="input-position" className="h-10 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">Отдел</Label>
                  <select value={department} onChange={(e) => setDepartment(e.target.value)}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    data-testid="select-department">
                    {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">Город</Label>
                  <select value={city} onChange={(e) => setCity(e.target.value)}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    data-testid="select-city">
                    {CITIES.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Телефон</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="8 701 234 5678" data-testid="input-phone" className="h-10 rounded-xl" />
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Пароль</Label>
                <Input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required data-testid="input-regPassword" className="h-10 rounded-xl" />
              </div>
              <Button type="submit" className="w-full h-10 rounded-xl font-semibold mt-1" disabled={loading} data-testid="button-register">
                {loading ? "Создание..." : "Создать аккаунт"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
