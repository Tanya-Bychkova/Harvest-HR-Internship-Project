import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, getAuthToken } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  Award,
  ChevronRight,
  ArrowLeft,
  CheckCircle,
  Clock,
  Tag,
  AlertCircle,
  GraduationCap,
  BarChart3,
  Settings,
  Plus,
  Trash2,
  Save,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Lesson {
  id: number;
  title: string;
  type: "text" | "video" | "link";
  content?: string;
  url?: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  lane: string; // mandatory | hr_assigned | self_directed
  duration: number;
  passScore: number;
  published: boolean;
  lessons: string; // JSON
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

interface Enrollment {
  id: number;
  courseId: number;
  userId: number;
  lane: string;
  status: string; // not_started | in_progress | completed
  progress: number;
  completedLessons: string; // JSON int[]
  deadline: string | null;
  completedAt: string | null;
  certNumber: string | null;
  quizPassed: boolean;
  quizScore: number | null;
  enrolledAt: string;
}

interface QuizQuestion {
  id: number;
  text: string;
  options: string[];
  correct_options: number[];
}

interface Quiz {
  id: number;
  courseId: number;
  timeLimit: number;
  questions: string; // JSON
}

// ─── Lane config ─────────────────────────────────────────────────────────────
const LANE_CFG: Record<string, { label: string; color: string; bg: string }> = {
  mandatory: { label: "Lane 1 — Обязательный", color: "#ef4444", bg: "#fee2e2" },
  hr_assigned: { label: "Lane 2 — Назначен HR", color: "#f59e0b", bg: "#fef3c7" },
  self_directed: { label: "Lane 3 — Личное развитие", color: "#10b981", bg: "#d1fae5" },
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  not_started: { label: "Не начат", color: "#6b7280" },
  in_progress: { label: "В процессе", color: "#3b82f6" },
  completed: { label: "Завершён", color: "#10b981" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseLessons(raw: string): Lesson[] {
  try { return JSON.parse(raw) as Lesson[]; } catch { return []; }
}
function parseCompletedLessons(raw: string): number[] {
  try { return JSON.parse(raw) as number[]; } catch { return []; }
}
function parseQuizQuestions(raw: string): QuizQuestion[] {
  try { return JSON.parse(raw) as QuizQuestion[]; } catch { return []; }
}

// ─── Main Component ───────────────────────────────────────────────────────────
type View =
  | { type: "list" }
  | { type: "catalogue" }
  | { type: "manage" }
  | { type: "analytics" }
  | { type: "course"; courseId: number }
  | { type: "lesson"; courseId: number; lessonIdx: number };

export default function LearningPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [view, setView] = useState<View>({ type: "list" });
  const isPrivileged = user?.roleCode === "hr" || user?.roleCode === "admin";

  const { data: courses = [] } = useQuery<Course[]>({ queryKey: ["/api/courses"] });
  const { data: enrollments = [] } = useQuery<Enrollment[]>({ queryKey: ["/api/courses/enrollments/mine"] });

  function myEnrollment(courseId: number) {
    return enrollments.find((e) => e.courseId === courseId);
  }

  const activeTab = view.type === "list" ? "my" : view.type === "catalogue" ? "catalogue" : view.type === "manage" ? "manage" : view.type === "analytics" ? "analytics" : "";

  const myEnrollments = enrollments.filter((e) => {
    const c = courses.find((c) => c.id === e.courseId);
    return !!c;
  });
  const done = myEnrollments.filter((e) => e.status === "completed").length;
  const mandatory = myEnrollments.filter((e) => {
    const c = courses.find((c) => c.id === e.courseId);
    return c?.lane === "mandatory";
  });
  const mandDone = mandatory.filter((e) => e.status === "completed").length;
  const pct = mandatory.length ? Math.round((mandDone / mandatory.length) * 100) : 100;

  return (
    <div>
      {/* Hero */}
      <div
        className="rounded-2xl p-6 mb-6 text-white flex items-center justify-between flex-wrap gap-4"
        style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)" }}
      >
        <div>
          <h2 className="text-xl font-extrabold mb-1">Обучение</h2>
          <p className="text-sm opacity-85">Проходи курсы, получай сертификаты — прямо в платформе</p>
        </div>
        <div className="flex gap-6">
          <div className="text-center">
            <div className="text-3xl font-black">{myEnrollments.length}</div>
            <div className="text-xs opacity-75 mt-0.5">Моих курсов</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black">{done}</div>
            <div className="text-xs opacity-75 mt-0.5">Завершено</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black">{pct}%</div>
            <div className="text-xs opacity-75 mt-0.5">Compliance</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {!["course", "lesson"].includes(view.type) && (
        <div className="flex gap-2 flex-wrap mb-6">
          {[
            { key: "my", label: "Мои курсы", view: { type: "list" } as View },
            { key: "catalogue", label: "Каталог", view: { type: "catalogue" } as View },
            ...(isPrivileged ? [
              { key: "manage", label: "Управление", view: { type: "manage" } as View },
              { key: "analytics", label: "Аналитика", view: { type: "analytics" } as View },
            ] : []),
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setView(t.view)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === t.key
                  ? "text-white"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
              style={activeTab === t.key ? { background: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))" } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* View routing */}
      {view.type === "list" && (
        <MyCoursesView courses={courses} enrollments={enrollments} onOpen={(id) => setView({ type: "course", courseId: id })} />
      )}
      {view.type === "catalogue" && (
        <CatalogueView courses={courses} enrollments={enrollments} onOpen={(id) => setView({ type: "course", courseId: id })} qc={qc} userId={user!.id} toast={toast} />
      )}
      {view.type === "course" && (
        <CourseDetailView
          courseId={view.courseId}
          courses={courses}
          enrollments={enrollments}
          onBack={() => setView({ type: "list" })}
          onOpenLesson={(cid, idx) => setView({ type: "lesson", courseId: cid, lessonIdx: idx })}
          qc={qc}
          userId={user!.id}
          toast={toast}
        />
      )}
      {view.type === "lesson" && (
        <LessonView
          courseId={view.courseId}
          lessonIdx={view.lessonIdx}
          courses={courses}
          enrollments={enrollments}
          onBack={(cid) => setView({ type: "course", courseId: cid })}
          onNext={(cid, idx) => setView({ type: "lesson", courseId: cid, lessonIdx: idx })}
          qc={qc}
          userId={user!.id}
          toast={toast}
        />
      )}
      {view.type === "manage" && isPrivileged && (
        <ManageView courses={courses} enrollments={enrollments} qc={qc} toast={toast} onOpen={(id) => setView({ type: "course", courseId: id })} />
      )}
      {view.type === "analytics" && isPrivileged && (
        <AnalyticsView courses={courses} />
      )}
    </div>
  );
}

// ─── My Courses View ──────────────────────────────────────────────────────────
function MyCoursesView({ courses, enrollments, onOpen }: { courses: Course[]; enrollments: Enrollment[]; onOpen: (id: number) => void }) {
  const lanes = [
    { key: "mandatory", title: "Lane 1 — Обязательные" },
    { key: "hr_assigned", title: "Lane 2 — Назначены HR" },
    { key: "self_directed", title: "Lane 3 — Личное развитие" },
  ];

  return (
    <div className="space-y-6">
      {lanes.map((lane) => {
        const laneEnrs = enrollments.filter((e) => {
          const c = courses.find((c) => c.id === e.courseId);
          return c?.lane === lane.key;
        });
        const cfg = LANE_CFG[lane.key];
        return (
          <div key={lane.key} className="border rounded-xl p-4" style={{ borderColor: "hsl(var(--border))" }}>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="font-bold text-sm">{lane.title}</h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
                {laneEnrs.length} курсов
              </span>
            </div>
            {laneEnrs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                {lane.key === "self_directed" ? "Перейдите в каталог чтобы записаться" : "Нет курсов в этой группе"}
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {laneEnrs.map((enr) => {
                  const course = courses.find((c) => c.id === enr.courseId);
                  if (!course) return null;
                  return <CourseCard key={enr.id} course={course} enr={enr} onOpen={onOpen} />;
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Catalogue View ───────────────────────────────────────────────────────────
function CatalogueView({ courses, enrollments, onOpen, qc, userId, toast }: any) {
  const enrollMutation = useMutation({
    mutationFn: (courseId: number) => apiRequest("POST", `/api/courses/${courseId}/enroll`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/courses/enrollments/mine"] }); toast({ title: "Вы записаны на курс" }); },
    onError: () => toast({ title: "Ошибка при записи", variant: "destructive" }),
  });

  const published = courses.filter((c: Course) => c.published);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">Все курсы <span className="text-muted-foreground font-normal text-sm">({published.length} доступно)</span></h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {published.map((c: Course) => {
          const enr = enrollments.find((e: Enrollment) => e.courseId === c.id);
          return <CourseCard key={c.id} course={c} enr={enr} onOpen={onOpen} onEnroll={!enr ? () => enrollMutation.mutate(c.id) : undefined} />;
        })}
      </div>
    </div>
  );
}

// ─── Course Card ─────────────────────────────────────────────────────────────
function CourseCard({ course, enr, onOpen, onEnroll }: { course: Course; enr?: Enrollment; onOpen: (id: number) => void; onEnroll?: () => void }) {
  const cfg = LANE_CFG[course.lane] || LANE_CFG.self_directed;
  const status = enr ? STATUS_LABEL[enr.status] || STATUS_LABEL.not_started : null;
  const lessons = parseLessons(course.lessons);

  return (
    <div
      className="rounded-xl border flex flex-col cursor-pointer hover:-translate-y-0.5 transition-transform"
      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}
      onClick={() => onOpen(course.id)}
    >
      <div className="h-1.5 rounded-t-xl" style={{ background: cfg.color }} />
      <div className="p-4 flex flex-col flex-1">
        <div className="font-bold text-sm mb-1.5">{course.title}</div>
        <div className="text-xs text-muted-foreground flex-1 leading-relaxed mb-3">{course.description}</div>
        <div className="flex gap-1.5 flex-wrap items-center mb-2">
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary">{course.category}</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary">{course.duration} мин</span>
          {status && <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ background: status.color + "22", color: status.color }}>{status.label}</span>}
        </div>
        {enr ? (
          <>
            <Progress value={enr.progress} className="h-1.5 mb-1" />
            <div className="text-[11px] text-muted-foreground">{enr.progress}% · {lessons.length} уроков{enr.deadline ? ` · Дедлайн: ${enr.deadline.split("T")[0]}` : ""}</div>
          </>
        ) : (
          onEnroll ? (
            <button
              className="text-xs font-semibold text-blue-500 text-left mt-1"
              onClick={(e) => { e.stopPropagation(); onEnroll(); }}
            >
              Записаться →
            </button>
          ) : null
        )}
      </div>
    </div>
  );
}

// ─── Course Detail View ───────────────────────────────────────────────────────
function CourseDetailView({ courseId, courses, enrollments, onBack, onOpenLesson, qc, userId, toast }: any) {
  const course = courses.find((c: Course) => c.id === courseId);
  if (!course) return <div>Курс не найден</div>;

  const enr: Enrollment | undefined = enrollments.find((e: Enrollment) => e.courseId === courseId);
  const lessons = parseLessons(course.lessons);
  const completedLessons = parseCompletedLessons(enr?.completedLessons ?? "[]");
  const cfg = LANE_CFG[course.lane] || LANE_CFG.self_directed;

  const enrollMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/courses/${courseId}/enroll`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/courses/enrollments/mine"] }); toast({ title: "Вы записаны на курс" }); },
  });

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft size={16} /> Назад
      </button>

      {/* Course header */}
      <div className="rounded-2xl p-5 mb-5 text-white" style={{ background: `linear-gradient(135deg, ${cfg.color}dd, ${cfg.color}99)` }}>
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full inline-block mb-2" style={{ background: "rgba(255,255,255,0.25)" }}>{cfg.label}</span>
        <h2 className="text-lg font-extrabold mb-1">{course.title}</h2>
        <p className="text-sm opacity-85 mb-3">{course.description}</p>
        <div className="flex gap-3 flex-wrap text-xs opacity-90">
          <span>{lessons.length} уроков</span>
          <span>{course.duration} мин</span>
          <span>{course.category}</span>
          {course.passScore > 0 && <span>Тест: мин. {course.passScore}%</span>}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Lessons list */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Программа курса</h3>
            {!enr && (
              <Button size="sm" onClick={() => enrollMutation.mutate()} disabled={enrollMutation.isPending}
                style={{ background: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))" }}>
                Записаться
              </Button>
            )}
          </div>

          {!enr ? (
            <div className="text-sm text-muted-foreground py-4">Запишитесь на курс, чтобы начать обучение</div>
          ) : (
            <div className="space-y-2">
              {lessons.map((l, i) => {
                const done = completedLessons.includes(l.id);
                return (
                  <div
                    key={l.id}
                    onClick={() => onOpenLesson(courseId, i)}
                    className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-secondary/50 transition"
                    style={{ borderColor: done ? "#10b98133" : "hsl(var(--border))", background: done ? "#f0fdf4" : "hsl(var(--card))" }}
                  >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: done ? "#10b981" : "hsl(var(--secondary))", color: done ? "white" : "inherit" }}>
                      {done ? <CheckCircle size={14} /> : i + 1}
                    </div>
                    <span className="text-sm flex-1 font-medium">{l.title}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                      {{ text: "Текст", video: "Видео", link: "Ссылка" }[l.type] ?? l.type}
                    </span>
                    <ChevronRight size={14} className="text-muted-foreground" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Certificate */}
          {enr?.status === "completed" && enr.certNumber && (
            <div className="mt-4 p-5 rounded-xl border-2 border-dashed text-center"
              style={{ borderColor: "hsl(var(--accent))", background: "hsl(var(--accent) / 0.05)" }}>
              <div className="text-3xl mb-1">🎓</div>
              <div className="text-xs font-bold tracking-widest text-muted-foreground mb-1">СЕРТИФИКАТ О ПРОХОЖДЕНИИ</div>
              <div className="font-bold text-base mb-1">{course.title}</div>
              <div className="text-sm text-muted-foreground">Завершён: {enr.completedAt?.split("T")[0]}</div>
              <div className="text-xs text-muted-foreground mt-1">{enr.certNumber}</div>
            </div>
          )}
        </div>

        {/* Sidebar info */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Информация о курсе</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                ["Уроков", lessons.length, "#3b82f6"],
                ["Длительность", `${course.duration} мин`, "#3b82f6"],
                ["Категория", course.category, null],
                ["Тест", course.passScore > 0 ? `Есть, мин. ${course.passScore}%` : "Нет", null],
                ...(enr ? [["Мой прогресс", `${enr.progress}%`, "#3b82f6"], ["Статус", STATUS_LABEL[enr.status]?.label ?? enr.status, "#3b82f6"]] : []),
                ...(enr?.deadline ? [["Дедлайн", enr.deadline.split("T")[0], null]] : []),
              ].map(([k, v, color]: any) => (
                <div key={k} className="flex justify-between items-center">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-semibold text-right" style={color ? { color } : {}}>{v}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {enr && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Прогресс</CardTitle></CardHeader>
              <CardContent>
                <Progress value={enr.progress} className="h-2 mb-2" />
                <div className="text-sm font-semibold">{completedLessons.length} из {lessons.length} уроков</div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Lesson View ──────────────────────────────────────────────────────────────
function LessonView({ courseId, lessonIdx, courses, enrollments, onBack, onNext, qc, userId, toast }: any) {
  const course = courses.find((c: Course) => c.id === courseId);
  if (!course) return null;

  const lessons = parseLessons(course.lessons);
  const lesson = lessons[lessonIdx];
  if (!lesson) return null;

  const enr: Enrollment | undefined = enrollments.find((e: Enrollment) => e.courseId === courseId);
  const completedLessons = parseCompletedLessons(enr?.completedLessons ?? "[]");
  const isDone = completedLessons.includes(lesson.id);
  const isLast = lessonIdx === lessons.length - 1;

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!enr) return;
      const newCompleted = completedLessons.includes(lesson.id) ? completedLessons : [...completedLessons, lesson.id];
      const progress = Math.round((newCompleted.length / lessons.length) * 100);
      const status = progress >= 100 ? "completed" : "in_progress";
      const now = new Date().toISOString();
      const certNumber = status === "completed" && !enr.certNumber
        ? `CERT-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`
        : enr.certNumber;
      const completedAt = status === "completed" && !enr.completedAt ? now : enr.completedAt;
      return apiRequest("PATCH", `/api/enrollments/${enr.id}`, {
        completedLessons: JSON.stringify(newCompleted),
        progress,
        status,
        certNumber,
        completedAt,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/courses/enrollments/mine"] });
      if (isLast) {
        toast({ title: "🎉 Курс завершён! Сертификат получен." });
        onBack(courseId);
      } else {
        onNext(courseId, lessonIdx + 1);
      }
    },
  });

  return (
    <div>
      <button onClick={() => onBack(courseId)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2">
        <ArrowLeft size={16} /> Назад к курсу
      </button>
      <div className="text-xs text-muted-foreground mb-4">
        {course.title} › Урок {lessonIdx + 1} из {lessons.length}
      </div>

      <Card className="mb-4">
        <CardContent className="p-5">
          <h2 className="text-lg font-bold mb-4">{lesson.title}</h2>
          {lesson.type === "text" ? (
            <div className="prose prose-sm max-w-none text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: lesson.content ?? "" }} />
          ) : (
            <a href={lesson.url} target="_blank" rel="noreferrer" className="text-blue-500 font-semibold">
              {lesson.type === "video" ? "Открыть видео ↗" : "Открыть ссылку ↗"}
            </a>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        {lessonIdx > 0 ? (
          <Button variant="outline" onClick={() => onNext(courseId, lessonIdx - 1)}>
            <ArrowLeft size={14} className="mr-1.5" /> Предыдущий
          </Button>
        ) : <div />}

        {!isDone ? (
          <Button onClick={() => completeMutation.mutate()} disabled={completeMutation.isPending}
            style={{ background: "#10b981", color: "white" }}>
            {isLast ? "Завершить курс ✓" : "Завершить урок →"}
          </Button>
        ) : isLast ? (
          <Button onClick={() => onBack(courseId)} style={{ background: "#10b981", color: "white" }}>К курсу →</Button>
        ) : (
          <Button onClick={() => onNext(courseId, lessonIdx + 1)} style={{ background: "#10b981", color: "white" }}>
            Следующий →
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Manage View (HR/Admin) ───────────────────────────────────────────────────
function ManageView({ courses, enrollments, qc, toast, onOpen }: any) {
  const [showModal, setShowModal] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("Общее");
  const [formLane, setFormLane] = useState("mandatory");
  const [formDuration, setFormDuration] = useState("30");
  const [formPassScore, setFormPassScore] = useState("0");
  const [formDesc, setFormDesc] = useState("");
  const [formLessons, setFormLessons] = useState<Lesson[]>([]);

  function openModal(course?: Course) {
    setEditCourse(course ?? null);
    if (course) {
      setFormTitle(course.title);
      setFormCategory(course.category);
      setFormLane(course.lane);
      setFormDuration(String(course.duration));
      setFormPassScore(String(course.passScore));
      setFormDesc(course.description);
      setFormLessons(parseLessons(course.lessons));
    } else {
      setFormTitle(""); setFormCategory("Общее"); setFormLane("mandatory");
      setFormDuration("30"); setFormPassScore("0"); setFormDesc(""); setFormLessons([]);
    }
    setShowModal(true);
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const body = { title: formTitle, description: formDesc, category: formCategory, lane: formLane, duration: Number(formDuration), passScore: Number(formPassScore), published: true, lessons: JSON.stringify(formLessons) };
      return editCourse
        ? apiRequest("PATCH", `/api/courses/${editCourse.id}`, body)
        : apiRequest("POST", "/api/courses", body);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/courses"] }); qc.invalidateQueries({ queryKey: ["/api/courses/enrollments/mine"] }); setShowModal(false); toast({ title: editCourse ? "Курс обновлён" : "Курс создан" }); },
    onError: () => toast({ title: "Ошибка", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/courses/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/courses"] }); toast({ title: "Курс удалён" }); },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-bold">Управление курсами</div>
          <div className="text-xs text-muted-foreground">{courses.length} курсов в системе</div>
        </div>
        <Button size="sm" onClick={() => openModal()} style={{ background: "#10b981", color: "white" }}>
          <Plus size={14} className="mr-1" /> Новый курс
        </Button>
      </div>

      <div className="space-y-3">
        {courses.map((c: Course) => {
          const cfg = LANE_CFG[c.lane] || LANE_CFG.self_directed;
          const enrCount = enrollments.filter((e: Enrollment) => e.courseId === c.id).length;
          const doneCount = enrollments.filter((e: Enrollment) => e.courseId === c.id && e.status === "completed").length;
          return (
            <div key={c.id} className="flex items-center gap-3 p-4 rounded-xl border" style={{ borderColor: "hsl(var(--border))" }}>
              <div className="w-1.5 h-10 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{c.title}</div>
                <div className="text-xs text-muted-foreground">{c.category} · {parseLessons(c.lessons).length} уроков · {c.duration} мин · {enrCount} записалось · {doneCount} завершило</div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full hidden sm:block" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" onClick={() => onOpen(c.id)}>Открыть</Button>
                <Button variant="outline" size="sm" onClick={() => openModal(c)}>Ред.</Button>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/40 hover:bg-destructive/10"
                  onClick={() => { if (confirm("Удалить курс?")) deleteMutation.mutate(c.id); }}>
                  <Trash2 size={13} />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Course edit modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editCourse ? "Редактировать курс" : "Новый курс"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-semibold mb-1 block">Название</label>
                <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Название курса" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Категория</label>
                <Input value={formCategory} onChange={(e) => setFormCategory(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Lane</label>
                <select value={formLane} onChange={(e) => setFormLane(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm bg-background">
                  <option value="mandatory">Обязательный</option>
                  <option value="hr_assigned">Назначен HR</option>
                  <option value="self_directed">Личное развитие</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Длительность (мин)</label>
                <Input type="number" value={formDuration} onChange={(e) => setFormDuration(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Мин. балл теста (%)</label>
                <Input type="number" value={formPassScore} onChange={(e) => setFormPassScore(e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold mb-1 block">Описание</label>
                <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={3}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background resize-none" placeholder="Описание курса" />
              </div>
            </div>

            {/* Lessons editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold">Уроки</label>
                <button className="text-xs text-blue-500 font-semibold"
                  onClick={() => setFormLessons([...formLessons, { id: Date.now(), title: "", type: "text", content: "", url: "" }])}>
                  + Добавить урок
                </button>
              </div>
              <div className="space-y-2">
                {formLessons.map((l, i) => (
                  <div key={l.id} className="flex gap-2 items-start">
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-2">{i + 1}</div>
                    <Input value={l.title} onChange={(e) => { const ls = [...formLessons]; ls[i] = { ...ls[i], title: e.target.value }; setFormLessons(ls); }} placeholder="Название урока" className="flex-1" />
                    <select value={l.type} onChange={(e) => { const ls = [...formLessons]; ls[i] = { ...ls[i], type: e.target.value as any }; setFormLessons(ls); }} className="border rounded-md px-2 py-2 text-sm bg-background">
                      <option value="text">Текст</option>
                      <option value="video">Видео</option>
                      <option value="link">Ссылка</option>
                    </select>
                    {l.type === "text"
                      ? <textarea value={l.content} onChange={(e) => { const ls = [...formLessons]; ls[i] = { ...ls[i], content: e.target.value }; setFormLessons(ls); }} rows={2} className="flex-1 border rounded-md px-2 py-2 text-xs bg-background resize-none" placeholder="Содержание (HTML разрешён)" />
                      : <Input value={l.url} onChange={(e) => { const ls = [...formLessons]; ls[i] = { ...ls[i], url: e.target.value }; setFormLessons(ls); }} placeholder="https://..." className="flex-1" />
                    }
                    <button onClick={() => setFormLessons(formLessons.filter((_, j) => j !== i))} className="mt-2 text-destructive hover:opacity-70"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Отмена</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !formTitle.trim()}
                style={{ background: "#10b981", color: "white" }}>
                <Save size={14} className="mr-1.5" /> Сохранить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Analytics View (HR/Admin) ────────────────────────────────────────────────
function AnalyticsView({ courses }: { courses: Course[] }) {
  const { data: allEnrollments = [] } = useQuery<Enrollment[]>({
    queryKey: ["/api/courses/enrollments/all", courses.map((c) => c.id)],
    queryFn: async () => {
      const token = getAuthToken();
      const results = await Promise.all(
        courses.map((c) =>
          fetch(`/api/courses/${c.id}/enrollments`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            credentials: "include",
          }).then((r) => r.json()).catch(() => [])
        )
      );
      return results.flat();
    },
    enabled: courses.length > 0,
  });

  const totalEnr = allEnrollments.length;
  const completed = allEnrollments.filter((e: Enrollment) => e.status === "completed").length;
  const inProgress = allEnrollments.filter((e: Enrollment) => e.status === "in_progress").length;
  const compRate = totalEnr ? Math.round((completed / totalEnr) * 100) : 0;

  return (
    <div>
      <h3 className="font-bold mb-4">Аналитика обучения</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Всего записей", value: totalEnr, color: "#3b82f6" },
          { label: "Завершено", value: completed, color: "#10b981" },
          { label: "В процессе", value: inProgress, color: "#f59e0b" },
          { label: "Completion rate", value: `${compRate}%`, color: "#8b5cf6" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Топ курсов по завершениям</CardTitle></CardHeader>
        <CardContent>
          {courses.slice(0, 5).map((c, i) => {
            const doneCount = allEnrollments.filter((e: Enrollment) => e.courseId === c.id && e.status === "completed").length;
            const totalCount = allEnrollments.filter((e: Enrollment) => e.courseId === c.id).length;
            return (
              <div key={c.id} className="flex items-center gap-3 mb-3 last:mb-0">
                <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{c.title}</div>
                  <div className="text-xs text-muted-foreground">{c.category}</div>
                </div>
                <div className="text-sm font-bold text-blue-500">{doneCount}/{totalCount}</div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
