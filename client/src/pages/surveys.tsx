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
import type { Survey, SurveyQuestion } from "@shared/schema";

type SurveyDetail = Survey & { questions: SurveyQuestion[] };
type SurveyWithAnswered = Survey & { userAnswered: boolean };

export default function SurveysPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const { data: surveys = [] } = useQuery<SurveyWithAnswered[]>({ queryKey: ["/api/surveys"] });
  const { data: detail } = useQuery<SurveyDetail>({
    queryKey: ["/api/surveys", activeId],
    queryFn: async () => (await apiRequest("GET", `/api/surveys/${activeId}`)).json(),
    enabled: activeId !== null,
  });

  const canCreate = user && (user.roleCode === "hr" || user.roleCode === "admin");

  const [form, setForm] = useState({
    title: "",
    description: "",
    questions: [{ text: "", type: "single" as "single" | "text", options: "Да,Нет" }],
  });

  async function create() {
    try {
      const questions = form.questions.map((q) => ({
        text: q.text,
        type: q.type,
        options: q.type === "single" ? q.options.split(",").map((x) => x.trim()).filter(Boolean) : null,
      }));
      await apiRequest("POST", "/api/surveys", { ...form, questions });
      toast({ title: "Опрос создан" });
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      setOpen(false);
      setForm({ title: "", description: "", questions: [{ text: "", type: "single", options: "Да,Нет" }] });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  }

  async function submit() {
    if (!detail) return;
    try {
      const answersArr = detail.questions.map((q) => ({ questionId: q.id, answer: answers[q.id] || "" }));
      await apiRequest("POST", `/api/surveys/${detail.id}/answer`, { answers: answersArr });
      toast({ title: "Спасибо за ответы!" });
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      setActiveId(null);
      setAnswers({});
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  }

  if (activeId !== null && detail) {
    return (
      <Card>
        <CardContent className="p-6 max-w-2xl">
          <Button size="sm" variant="ghost" onClick={() => setActiveId(null)} className="mb-3" data-testid="button-back">
            ← Назад
          </Button>
          <h2 className="text-xl font-bold mb-2 text-primary" data-testid="text-survey-title">{detail.title}</h2>
          {detail.description && <p className="text-sm text-muted-foreground mb-4">{detail.description}</p>}
          <div className="space-y-5">
            {detail.questions.map((q, i) => {
              const options = q.options ? (JSON.parse(q.options) as string[]) : [];
              return (
                <div key={q.id} data-testid={`question-${q.id}`}>
                  <Label className="block mb-2">
                    {i + 1}. {q.text}
                  </Label>
                  {q.type === "single" ? (
                    <div className="space-y-1.5">
                      {options.map((opt) => (
                        <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            checked={answers[q.id] === opt}
                            onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                            data-testid={`radio-${q.id}-${opt}`}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <Textarea
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      rows={3}
                      data-testid={`textarea-${q.id}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <Button onClick={submit} className="mt-5" data-testid="button-submit-survey">
            Отправить ответы
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Опросы</h3>
          {canCreate && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-survey">+ Новый опрос</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Новый опрос</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Название</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="input-title" />
                  </div>
                  <div>
                    <Label>Описание</Label>
                    <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="input-description" />
                  </div>
                  <div className="space-y-3">
                    <Label>Вопросы</Label>
                    {form.questions.map((q, i) => (
                      <div key={i} className="border border-border rounded-md p-3 space-y-2">
                        <Input
                          placeholder="Текст вопроса"
                          value={q.text}
                          onChange={(e) => {
                            const newQs = [...form.questions];
                            newQs[i].text = e.target.value;
                            setForm({ ...form, questions: newQs });
                          }}
                          data-testid={`input-question-${i}`}
                        />
                        <select
                          value={q.type}
                          onChange={(e) => {
                            const newQs = [...form.questions];
                            newQs[i].type = e.target.value as any;
                            setForm({ ...form, questions: newQs });
                          }}
                          className="w-full h-9 border border-input bg-background rounded-md px-3 text-sm"
                          data-testid={`select-type-${i}`}
                        >
                          <option value="single">Один из вариантов</option>
                          <option value="text">Текстовый ответ</option>
                        </select>
                        {q.type === "single" && (
                          <Input
                            placeholder="Варианты через запятую"
                            value={q.options}
                            onChange={(e) => {
                              const newQs = [...form.questions];
                              newQs[i].options = e.target.value;
                              setForm({ ...form, questions: newQs });
                            }}
                            data-testid={`input-options-${i}`}
                          />
                        )}
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setForm({
                          ...form,
                          questions: [...form.questions, { text: "", type: "single", options: "Да,Нет" }],
                        })
                      }
                      data-testid="button-add-question"
                    >
                      + Добавить вопрос
                    </Button>
                  </div>
                  <Button onClick={create} className="w-full" data-testid="button-create-survey">
                    Создать опрос
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        {surveys.length === 0 ? (
          <div className="text-xs text-muted-foreground">Опросов нет.</div>
        ) : (
          <div className="space-y-2">
            {surveys.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between border border-border rounded-md p-3"
                data-testid={`row-survey-${s.id}`}
              >
                <div>
                  <div className="font-medium text-sm" data-testid={`text-survey-title-${s.id}`}>{s.title}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {s.description}
                    {s.deadline ? ` • до ${s.deadline}` : ""}
                  </div>
                </div>
                {s.userAnswered ? (
                  <span className="text-xs text-green-600 font-semibold" data-testid={`status-survey-${s.id}`}>Пройдено</span>
                ) : (
                  <Button size="sm" onClick={() => { setActiveId(s.id); setAnswers({}); }} data-testid={`button-take-${s.id}`}>
                    Пройти
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
