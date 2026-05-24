import type { Express, Response, NextFunction } from "express";
import type { Server } from "node:http";
import { z } from "zod";
import { storage } from "./storage";
import {
  authMiddleware,
  requireAuth,
  requireRole,
  hashPassword,
  verifyPassword,
  issueToken,
  revokeToken,
  stripPassword,
  isPrivileged,
  type AuthedRequest,
} from "./auth";
import {
  loginSchema,
  registerSchema,
  insertUserSchema,
  insertTaskSchema,
  insertDocumentSchema,
  insertKnowledgeArticleSchema,
  insertSurveySchema,
  insertHrRequestSchema,
  insertHrRequestCommentSchema,
  insertEventSchema,
  insertOnboardingTrackSchema,
  insertOnboardingStepSchema,
  insertNotificationSchema,
  insertDepartmentSchema,
} from "@shared/schema";
import { seedDatabase } from "./seed";

function badRequest(res: Response, err: unknown) {
  const message = err instanceof z.ZodError ? err.errors.map((e) => e.message).join("; ") : String(err);
  return res.status(400).json({ error: true, message });
}

function notFound(res: Response, what = "Не найдено") {
  return res.status(404).json({ error: true, message: what });
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Bootstrap seed if DB empty
  await seedDatabase();

  app.use(authMiddleware);

  /* =========================
     Auth
     ========================= */

  app.post("/api/auth/login", async (req: AuthedRequest, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);
      if (!user || !verifyPassword(password, user.password)) {
        return res.status(401).json({ error: true, message: "Неверный email или пароль" });
      }
      if (user.status === "fired") {
        return res.status(403).json({ error: true, message: "Учетная запись отключена" });
      }
      const token = issueToken(user.id);
      res.json({ token, user: stripPassword(user) });
    } catch (e) {
      badRequest(res, e);
    }
  });

  app.post("/api/auth/register", async (req: AuthedRequest, res) => {
    try {
      const data = registerSchema.parse(req.body);
      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(409).json({ error: true, message: "Пользователь с таким email уже существует" });
      }
      // Resolve / create department & position references
      let departmentId: number | null = null;
      if (data.department) {
        const list = await storage.listDepartments();
        const found = list.find((d) => d.name === data.department);
        if (found) departmentId = found.id;
        else departmentId = (await storage.createDepartment({ name: data.department, city: data.city ?? null })).id;
      }
      let positionId: number | null = null;
      if (data.position) {
        const list = await storage.listPositions();
        const found = list.find((p) => p.name === data.position);
        if (found) positionId = found.id;
        else positionId = (await storage.createPosition({ name: data.position })).id;
      }
      const created = await storage.createUser({
        email: data.email,
        password: hashPassword(data.password),
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName ?? null,
        phone: data.phone ?? null,
        city: data.city ?? null,
        departmentId,
        positionId,
        roleCode: "employee",
        status: "active",
        dateJoined: new Date().toISOString().slice(0, 10),
        note: null,
      } as any);
      const token = issueToken(created.id);
      res.status(201).json({ token, user: stripPassword(created) });
    } catch (e) {
      badRequest(res, e);
    }
  });

  app.post("/api/auth/logout", (req: AuthedRequest, res) => {
    const h = req.headers.authorization;
    if (h && h.startsWith("Bearer ")) revokeToken(h.slice(7).trim());
    res.json({ ok: true });
  });

  app.get("/api/users/me", requireAuth, async (req: AuthedRequest, res) => {
    res.json(stripPassword(req.user!));
  });

  /* =========================
     Departments / Positions
     ========================= */

  app.get("/api/departments", async (_req, res) => {
    res.json(await storage.listDepartments());
  });
  app.post("/api/departments", requireRole("hr", "admin"), async (req, res) => {
    try {
      const data = insertDepartmentSchema.parse(req.body);
      res.status(201).json(await storage.createDepartment(data));
    } catch (e) {
      badRequest(res, e);
    }
  });
  app.get("/api/positions", async (_req, res) => {
    res.json(await storage.listPositions());
  });
  app.post("/api/positions", requireRole("hr", "admin"), async (req, res) => {
    try {
      const name = String(req.body?.name || "").trim();
      if (!name) return badRequest(res, "name is required");
      const list = await storage.listPositions();
      const dup = list.find((p) => p.name === name);
      if (dup) return res.status(200).json(dup);
      res.status(201).json(await storage.createPosition({ name }));
    } catch (e) {
      badRequest(res, e);
    }
  });

  // Roles catalog (read-only). TZ-1 § 3 — four built-in roles.
  app.get("/api/roles", requireAuth, async (_req, res) => {
    res.json([
      { code: "employee", name: "Сотрудник" },
      { code: "hr", name: "HR" },
      { code: "manager", name: "Руководитель" },
      { code: "admin", name: "Администратор" },
    ]);
  });

  /* =========================
     Users
     ========================= */

  app.get("/api/users", requireAuth, async (req: AuthedRequest, res) => {
    const user = req.user!;
    const filters: any = {};
    if (typeof req.query.departmentId === "string") filters.departmentId = Number(req.query.departmentId);
    if (typeof req.query.status === "string") filters.status = req.query.status;
    if (typeof req.query.q === "string") filters.q = req.query.q;
    if (typeof req.query.city === "string") filters.city = req.query.city;

    // Manager: only their own department
    if (user.roleCode === "manager") {
      if (!filters.departmentId) filters.departmentId = user.departmentId;
      if (user.departmentId && filters.departmentId !== user.departmentId) {
        return res.status(403).json({ error: true, message: "У вас нет доступа к этому объекту" });
      }
    }
    // Employee: only themselves
    if (user.roleCode === "employee") {
      return res.json([stripPassword(user)]);
    }
    const list = await storage.listUsers(filters);
    res.json(list.map(stripPassword));
  });

  app.post("/api/users", requireRole("hr", "admin"), async (req, res) => {
    try {
      const data = insertUserSchema.parse({
        ...req.body,
        password: hashPassword(req.body.password || "changeme123"),
      });
      const created = await storage.createUser(data);
      res.status(201).json(stripPassword(created));
    } catch (e) {
      badRequest(res, e);
    }
  });

  app.get("/api/users/:id", requireAuth, async (req: AuthedRequest, res) => {
    const id = Number(req.params.id);
    const u = await storage.getUser(id);
    if (!u) return notFound(res, "Пользователь не найден");
    const me = req.user!;
    if (me.roleCode === "employee" && me.id !== id) {
      return res.status(403).json({ error: true, message: "У вас нет доступа к этому объекту" });
    }
    if (me.roleCode === "manager" && me.departmentId !== u.departmentId && me.id !== id) {
      return res.status(403).json({ error: true, message: "У вас нет доступа к этому объекту" });
    }
    res.json(stripPassword(u));
  });

  app.patch("/api/users/:id", requireAuth, async (req: AuthedRequest, res) => {
    try {
      const id = Number(req.params.id);
      const me = req.user!;
      if (me.id !== id && !isPrivileged(me)) {
        return res.status(403).json({ error: true, message: "У вас нет доступа к этому объекту" });
      }
      const patch: any = { ...req.body };
      delete patch.id;
      delete patch.createdAt;
      delete patch.updatedAt;
      if (patch.password) patch.password = hashPassword(patch.password);
      // only admin can change role
      if (patch.roleCode && me.roleCode !== "admin") delete patch.roleCode;
      const updated = await storage.updateUser(id, patch);
      if (!updated) return notFound(res, "Пользователь не найден");
      res.json(stripPassword(updated));
    } catch (e) {
      badRequest(res, e);
    }
  });

  app.delete("/api/users/:id", requireRole("admin"), async (req, res) => {
    const ok = await storage.deleteUser(Number(req.params.id));
    res.json({ ok });
  });

  /* =========================
     Tasks
     ========================= */

  app.get("/api/tasks", requireAuth, async (req: AuthedRequest, res) => {
    const me = req.user!;
    const filters: any = {};
    if (typeof req.query.status === "string") filters.status = req.query.status;
    if (typeof req.query.assigneeId === "string") filters.assigneeId = Number(req.query.assigneeId);

    if (me.roleCode === "employee") {
      filters.assigneeId = me.id;
    } else if (me.roleCode === "manager") {
      filters.departmentId = me.departmentId ?? undefined;
    }
    const list = await storage.listTasks(filters);
    res.json(list);
  });

  app.post("/api/tasks", requireRole("hr", "manager", "admin"), async (req: AuthedRequest, res) => {
    try {
      const data = insertTaskSchema.parse({ ...req.body, creatorId: req.user!.id });
      const t = await storage.createTask(data);
      if (t.assigneeId) {
        await storage.createNotification({
          userId: t.assigneeId,
          title: "Новая задача",
          message: t.title,
          type: "task",
          link: `/tasks`,
        });
      }
      res.status(201).json(t);
    } catch (e) {
      badRequest(res, e);
    }
  });

  app.get("/api/tasks/:id", requireAuth, async (req: AuthedRequest, res) => {
    const t = await storage.getTask(Number(req.params.id));
    if (!t) return notFound(res, "Задача не найдена");
    const me = req.user!;
    if (me.roleCode === "employee" && t.assigneeId !== me.id) {
      return res.status(403).json({ error: true, message: "У вас нет доступа к этому объекту" });
    }
    res.json(t);
  });

  app.patch("/api/tasks/:id", requireAuth, async (req: AuthedRequest, res) => {
    try {
      const id = Number(req.params.id);
      const t = await storage.getTask(id);
      if (!t) return notFound(res, "Задача не найдена");
      const me = req.user!;
      if (!isPrivileged(me) && t.assigneeId !== me.id) {
        return res.status(403).json({ error: true, message: "У вас нет доступа к этому объекту" });
      }
      // Employees may only modify status
      const patch: any = { ...req.body };
      delete patch.id;
      delete patch.createdAt;
      delete patch.updatedAt;
      if (me.roleCode === "employee") {
        const allowed = ["status"];
        for (const k of Object.keys(patch)) if (!allowed.includes(k)) delete patch[k];
      }
      const out = await storage.updateTask(id, patch);
      res.json(out);
    } catch (e) {
      badRequest(res, e);
    }
  });

  app.patch("/api/tasks/:id/complete", requireAuth, async (req: AuthedRequest, res) => {
    const id = Number(req.params.id);
    const t = await storage.getTask(id);
    if (!t) return notFound(res, "Задача не найдена");
    const me = req.user!;
    if (!isPrivileged(me) && t.assigneeId !== me.id) {
      return res.status(403).json({ error: true, message: "У вас нет доступа к этому объекту" });
    }
    const out = await storage.completeTask(id);
    res.json(out);
  });

  app.delete("/api/tasks/:id", requireRole("hr", "manager", "admin"), async (req, res) => {
    const ok = await storage.deleteTask(Number(req.params.id));
    res.json({ ok });
  });

  /* =========================
     Documents
     ========================= */

  app.get("/api/documents", requireAuth, async (req: AuthedRequest, res) => {
    const me = req.user!;
    if (isPrivileged(me)) {
      const docs = await storage.listDocuments();
      return res.json(docs);
    }
    // Employees: only docs assigned to them
    const assignments = await storage.listDocumentAssignmentsForUser(me.id);
    const docs = await Promise.all(assignments.map((a) => storage.getDocument(a.documentId)));
    const merged = assignments
      .map((a, i) => (docs[i] ? { ...docs[i]!, assignment: a } : null))
      .filter(Boolean);
    res.json(merged);
  });

  app.post("/api/documents", requireRole("hr", "admin"), async (req: AuthedRequest, res) => {
    try {
      const data = insertDocumentSchema.parse({ ...req.body, uploadedBy: req.user!.id });
      const d = await storage.createDocument(data);
      res.status(201).json(d);
    } catch (e) {
      badRequest(res, e);
    }
  });

  app.get("/api/documents/:id", requireAuth, async (req: AuthedRequest, res) => {
    const d = await storage.getDocument(Number(req.params.id));
    if (!d) return notFound(res, "Документ не найден");
    const me = req.user!;
    if (!isPrivileged(me)) {
      const assigned = (await storage.listDocumentAssignmentsForUser(me.id)).some((a) => a.documentId === d.id);
      if (!assigned) return res.status(403).json({ error: true, message: "У вас нет доступа к этому объекту" });
    }
    res.json(d);
  });

  app.post("/api/documents/:id/assign", requireRole("hr", "admin"), async (req: AuthedRequest, res) => {
    try {
      const documentId = Number(req.params.id);
      const userIds: number[] = req.body.userIds || [];
      const out = [];
      for (const uid of userIds) {
        out.push(
          await storage.assignDocument({
            documentId,
            userId: uid,
            assignedBy: req.user!.id,
            status: "assigned",
          } as any),
        );
        await storage.createNotification({
          userId: uid,
          title: "Новый документ",
          message: "Вам назначен документ для ознакомления",
          type: "document",
          link: "/documents",
        });
      }
      res.json(out);
    } catch (e) {
      badRequest(res, e);
    }
  });

  app.patch("/api/documents/:id/confirm", requireAuth, async (req: AuthedRequest, res) => {
    const documentId = Number(req.params.id);
    const me = req.user!;
    const all = await storage.listDocumentAssignmentsForUser(me.id);
    const a = all.find((x) => x.documentId === documentId);
    if (!a) return res.status(403).json({ error: true, message: "Документ не назначен" });
    const out = await storage.confirmDocument(a.id);
    res.json(out);
  });

  // Mark a document as viewed (TZ-1 § 6.5 — "Сотрудник открывает документ").
  app.patch("/api/documents/:id/view", requireAuth, async (req: AuthedRequest, res) => {
    const documentId = Number(req.params.id);
    const me = req.user!;
    const all = await storage.listDocumentAssignmentsForUser(me.id);
    const a = all.find((x) => x.documentId === documentId);
    if (!a) return res.status(403).json({ error: true, message: "Документ не назначен" });
    // Only flip to viewed if it hasn't already been confirmed.
    if (a.status === "confirmed") return res.json(a);
    const out = await storage.markDocumentViewed(a.id);
    res.json(out);
  });

  app.get("/api/documents/:id/assignments", requireRole("hr", "admin", "manager"), async (req, res) => {
    res.json(await storage.listDocumentAssignmentsForDoc(Number(req.params.id)));
  });

  app.delete("/api/documents/:id", requireRole("hr", "admin"), async (req, res) => {
    res.json({ ok: await storage.deleteDocument(Number(req.params.id)) });
  });

  /* =========================
     Knowledge base
     ========================= */

  app.get("/api/knowledge", requireAuth, async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    res.json(await storage.listKnowledgeArticles(q));
  });
  app.post("/api/knowledge", requireRole("hr", "admin"), async (req: AuthedRequest, res) => {
    try {
      const data = insertKnowledgeArticleSchema.parse({ ...req.body, authorId: req.user!.id });
      res.status(201).json(await storage.createKnowledgeArticle(data));
    } catch (e) {
      badRequest(res, e);
    }
  });
  app.get("/api/knowledge/:id", requireAuth, async (req, res) => {
    const a = await storage.getKnowledgeArticle(Number(req.params.id));
    if (!a) return notFound(res, "Статья не найдена");
    res.json(a);
  });
  app.patch("/api/knowledge/:id", requireRole("hr", "admin"), async (req, res) => {
    try {
      const out = await storage.updateKnowledgeArticle(Number(req.params.id), req.body);
      if (!out) return notFound(res, "Статья не найдена");
      res.json(out);
    } catch (e) {
      badRequest(res, e);
    }
  });
  app.delete("/api/knowledge/:id", requireRole("hr", "admin"), async (req, res) => {
    res.json({ ok: await storage.deleteKnowledgeArticle(Number(req.params.id)) });
  });

  /* =========================
     Surveys
     ========================= */

  app.get("/api/surveys", requireAuth, async (req: AuthedRequest, res) => {
    const list = await storage.listSurveys();
    // Annotate with whether current user has answered
    const me = req.user!;
    const annotated = await Promise.all(
      list.map(async (s) => ({
        ...s,
        userAnswered: await storage.hasUserAnswered(s.id, me.id),
      })),
    );
    res.json(annotated);
  });
  app.post("/api/surveys", requireRole("hr", "admin"), async (req: AuthedRequest, res) => {
    try {
      const data = insertSurveySchema.parse({ ...req.body, createdBy: req.user!.id });
      const survey = await storage.createSurvey(data);
      // questions optional in body
      if (Array.isArray(req.body.questions)) {
        for (let i = 0; i < req.body.questions.length; i++) {
          const q = req.body.questions[i];
          await storage.addSurveyQuestion({
            surveyId: survey.id,
            text: q.text,
            type: q.type || "single",
            options: q.options ? JSON.stringify(q.options) : null,
            position: i,
          } as any);
        }
      }
      res.status(201).json(survey);
    } catch (e) {
      badRequest(res, e);
    }
  });
  app.get("/api/surveys/:id", requireAuth, async (req, res) => {
    const s = await storage.getSurvey(Number(req.params.id));
    if (!s) return notFound(res, "Опрос не найден");
    const questions = await storage.listSurveyQuestions(s.id);
    res.json({ ...s, questions });
  });
  app.post("/api/surveys/:id/answer", requireAuth, async (req: AuthedRequest, res) => {
    try {
      const surveyId = Number(req.params.id);
      const me = req.user!;
      if (await storage.hasUserAnswered(surveyId, me.id)) {
        return res.status(409).json({ error: true, message: "Вы уже прошли этот опрос" });
      }
      const answers = (req.body.answers || []) as { questionId: number; answer: string }[];
      await storage.submitSurveyAnswers(surveyId, me.id, answers);
      res.json({ ok: true });
    } catch (e) {
      badRequest(res, e);
    }
  });
  app.get("/api/surveys/:id/results", requireRole("hr", "admin"), async (req, res) => {
    const surveyId = Number(req.params.id);
    const questions = await storage.listSurveyQuestions(surveyId);
    const answers = await storage.listSurveyAnswers(surveyId);
    res.json({ questions, answers });
  });
  app.delete("/api/surveys/:id", requireRole("hr", "admin"), async (req, res) => {
    res.json({ ok: await storage.deleteSurvey(Number(req.params.id)) });
  });

  /* =========================
     HR requests
     ========================= */

  app.get("/api/hr-requests", requireAuth, async (req: AuthedRequest, res) => {
    const me = req.user!;
    const filters: any = {};
    if (me.roleCode === "employee") filters.userId = me.id;
    res.json(await storage.listHrRequests(filters));
  });
  app.post("/api/hr-requests", requireAuth, async (req: AuthedRequest, res) => {
    try {
      const data = insertHrRequestSchema.parse({ ...req.body, userId: req.user!.id });
      const out = await storage.createHrRequest(data);
      // Notify all HR users
      const hrUsers = (await storage.listUsers({})).filter((u) => u.roleCode === "hr" || u.roleCode === "admin");
      for (const h of hrUsers) {
        await storage.createNotification({
          userId: h.id,
          title: "Новое обращение в HR",
          message: out.subject,
          type: "hr",
          link: "/hr-requests",
        });
      }
      res.status(201).json(out);
    } catch (e) {
      badRequest(res, e);
    }
  });
  app.get("/api/hr-requests/:id", requireAuth, async (req: AuthedRequest, res) => {
    const r = await storage.getHrRequest(Number(req.params.id));
    if (!r) return notFound(res, "Обращение не найдено");
    if (req.user!.roleCode === "employee" && r.userId !== req.user!.id) {
      return res.status(403).json({ error: true, message: "У вас нет доступа к этому объекту" });
    }
    const comments = await storage.listHrRequestComments(r.id);
    res.json({ ...r, comments });
  });
  app.post("/api/hr-requests/:id/comment", requireAuth, async (req: AuthedRequest, res) => {
    try {
      const requestId = Number(req.params.id);
      const r = await storage.getHrRequest(requestId);
      if (!r) return notFound(res, "Обращение не найдено");
      const me = req.user!;
      if (me.roleCode === "employee" && r.userId !== me.id) {
        return res.status(403).json({ error: true, message: "У вас нет доступа к этому объекту" });
      }
      const data = insertHrRequestCommentSchema.parse({
        requestId,
        authorId: me.id,
        message: req.body.message,
      });
      const out = await storage.addHrRequestComment(data);
      // Notify owner if HR comments
      if (isPrivileged(me) && r.userId !== me.id) {
        await storage.createNotification({
          userId: r.userId,
          title: "Ответ HR",
          message: `Ответ на обращение «${r.subject}»`,
          type: "hr",
          link: "/hr-requests",
        });
      }
      res.status(201).json(out);
    } catch (e) {
      badRequest(res, e);
    }
  });
  app.patch("/api/hr-requests/:id/close", requireRole("hr", "admin"), async (req, res) => {
    const out = await storage.closeHrRequest(Number(req.params.id));
    if (!out) return notFound(res, "Обращение не найдено");
    res.json(out);
  });

  /* =========================
     Events / calendar
     ========================= */

  app.get("/api/events", requireAuth, async (_req, res) => {
    res.json(await storage.listEvents());
  });
  app.post("/api/events", requireRole("hr", "admin", "manager"), async (req: AuthedRequest, res) => {
    try {
      const data = insertEventSchema.parse({ ...req.body, createdBy: req.user!.id });
      res.status(201).json(await storage.createEvent(data));
    } catch (e) {
      badRequest(res, e);
    }
  });
  app.patch("/api/events/:id", requireRole("hr", "admin", "manager"), async (req, res) => {
    try {
      const out = await storage.updateEvent(Number(req.params.id), req.body);
      if (!out) return notFound(res, "Событие не найдено");
      res.json(out);
    } catch (e) {
      badRequest(res, e);
    }
  });
  app.delete("/api/events/:id", requireRole("hr", "admin"), async (req, res) => {
    res.json({ ok: await storage.deleteEvent(Number(req.params.id)) });
  });

  /* =========================
     Onboarding
     ========================= */

  app.get("/api/onboarding/tracks", requireAuth, async (_req, res) => {
    const tracks = await storage.listOnboardingTracks();
    const withSteps = await Promise.all(
      tracks.map(async (t) => ({ ...t, steps: await storage.listOnboardingSteps(t.id) })),
    );
    res.json(withSteps);
  });
  app.post("/api/onboarding/tracks", requireRole("hr", "admin"), async (req: AuthedRequest, res) => {
    try {
      const data = insertOnboardingTrackSchema.parse({ ...req.body, createdBy: req.user!.id });
      const t = await storage.createOnboardingTrack(data);
      if (Array.isArray(req.body.steps)) {
        for (let i = 0; i < req.body.steps.length; i++) {
          const s = req.body.steps[i];
          await storage.addOnboardingStep({
            trackId: t.id,
            title: s.title,
            description: s.description ?? null,
            dueDays: s.dueDays ?? 7,
            position: i,
          } as any);
        }
      }
      res.status(201).json(t);
    } catch (e) {
      badRequest(res, e);
    }
  });
  app.post("/api/onboarding/tracks/:id/assign", requireRole("hr", "admin"), async (req, res) => {
    const trackId = Number(req.params.id);
    const userIds: number[] = req.body.userIds || [];
    for (const uid of userIds) await storage.assignTrackToUser(uid, trackId);
    res.json({ ok: true, assigned: userIds.length });
  });
  app.get("/api/onboarding/my-progress", requireAuth, async (req: AuthedRequest, res) => {
    const progress = await storage.getUserOnboardingProgress(req.user!.id);
    // enrich with step + track titles
    const tracks = await storage.listOnboardingTracks();
    const enriched = await Promise.all(
      progress.map(async (p) => {
        const steps = await storage.listOnboardingSteps(p.trackId);
        return {
          ...p,
          step: steps.find((s) => s.id === p.stepId),
          track: tracks.find((t) => t.id === p.trackId),
        };
      }),
    );
    res.json(enriched);
  });
  app.patch("/api/onboarding/progress/:id", requireAuth, async (req: AuthedRequest, res) => {
    const out = await storage.setStepStatus(Number(req.params.id), req.body.status === "done" ? "done" : "pending");
    if (!out) return notFound(res, "Шаг не найден");
    res.json(out);
  });

  /* =========================
     Notifications
     ========================= */

  app.get("/api/notifications", requireAuth, async (req: AuthedRequest, res) => {
    res.json(await storage.listNotifications(req.user!.id));
  });
  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    const out = await storage.markNotificationRead(Number(req.params.id));
    if (!out) return notFound(res);
    res.json(out);
  });
  app.patch("/api/notifications/read-all", requireAuth, async (req: AuthedRequest, res) => {
    await storage.markAllNotificationsRead(req.user!.id);
    res.json({ ok: true });
  });

  /* =========================
     Stats — minimal analytics
     ========================= */

  app.get("/api/stats/overview", requireAuth, async (req: AuthedRequest, res) => {
    const me = req.user!;
    const allUsers = await storage.listUsers({});
    const tasks = await storage.listTasks();
    const docs = await storage.listDocuments();
    const surveys = await storage.listSurveys();
    const hrReqs = await storage.listHrRequests();
    const events = await storage.listEvents();
    res.json({
      totalUsers: allUsers.length,
      activeUsers: allUsers.filter((u) => u.status === "active").length,
      tasksTotal: tasks.length,
      tasksDone: tasks.filter((t) => t.status === "done").length,
      tasksOpen: tasks.filter((t) => t.status !== "done").length,
      documents: docs.length,
      surveys: surveys.length,
      hrRequestsOpen: hrReqs.filter((r) => r.status !== "closed").length,
      events: events.length,
      myRole: me.roleCode,
    });
  });

  /* =========================
  /* =========================
     Learning / Courses
     ========================= */

  // List all courses
  app.get("/api/courses", requireAuth, async (_req: AuthedRequest, res) => {
    const list = await storage.listCourses();
    res.json(list);
  });

  // Get my enrollments (must be BEFORE /:id route)
  app.get("/api/courses/enrollments/mine", requireAuth, async (req: AuthedRequest, res) => {
    const list = await storage.listEnrollmentsForUser(req.user!.id);
    res.json(list);
  });

  // Get single course
  app.get("/api/courses/:id", requireAuth, async (req: AuthedRequest, res) => {
    const course = await storage.getCourse(Number(req.params.id));
    if (!course) return notFound(res, "Курс не найден");
    res.json(course);
  });

  // Create course (HR/Admin)
  app.post("/api/courses", requireAuth, async (req: AuthedRequest, res) => {
    try {
      if (!isPrivileged(req.user!)) return res.status(403).json({ error: true, message: "Нет доступа" });
      const course = await storage.createCourse({ ...req.body, createdBy: req.user!.id } as any);
      res.json(course);
    } catch (e) { badRequest(res, e); }
  });

  // Update course (HR/Admin)
  app.patch("/api/courses/:id", requireAuth, async (req: AuthedRequest, res) => {
    try {
      if (!isPrivileged(req.user!)) return res.status(403).json({ error: true, message: "Нет доступа" });
      const course = await storage.updateCourse(Number(req.params.id), req.body);
      if (!course) return notFound(res, "Курс не найден");
      res.json(course);
    } catch (e) { badRequest(res, e); }
  });

  // Delete course (HR/Admin)
  app.delete("/api/courses/:id", requireAuth, async (req: AuthedRequest, res) => {
    if (!isPrivileged(req.user!)) return res.status(403).json({ error: true, message: "Нет доступа" });
    await storage.deleteCourse(Number(req.params.id));
    res.json({ ok: true });
  });

  // Get all enrollments for a course (HR/Admin)
  app.get("/api/courses/:id/enrollments", requireAuth, async (req: AuthedRequest, res) => {
    if (!isPrivileged(req.user!)) return res.status(403).json({ error: true, message: "Нет доступа" });
    const list = await storage.listEnrollmentsForCourse(Number(req.params.id));
    res.json(list);
  });

  // Self-enroll in a course
  app.post("/api/courses/:id/enroll", requireAuth, async (req: AuthedRequest, res) => {
    try {
      const course = await storage.getCourse(Number(req.params.id));
      if (!course) return notFound(res, "Курс не найден");
      const enr = await storage.enroll(req.user!.id, course.id, "self_directed", null);
      res.json(enr);
    } catch (e) { badRequest(res, e); }
  });

  // HR assigns course to users
  app.post("/api/courses/:id/assign", requireAuth, async (req: AuthedRequest, res) => {
    try {
      if (!isPrivileged(req.user!)) return res.status(403).json({ error: true, message: "Нет доступа" });
      const { userIds, deadline } = req.body as { userIds: number[]; deadline?: string };
      const course = await storage.getCourse(Number(req.params.id));
      if (!course) return notFound(res, "Курс не найден");
      const results = [];
      for (const uid of userIds) {
        const enr = await storage.enroll(uid, course.id, "hr_assigned", deadline ?? null);
        results.push(enr);
      }
      res.json({ enrolled: results.length });
    } catch (e) { badRequest(res, e); }
  });

  // Update enrollment (progress, complete lesson, etc.)
  app.patch("/api/enrollments/:id", requireAuth, async (req: AuthedRequest, res) => {
    try {
      const enr = await storage.updateEnrollment(Number(req.params.id), req.body);
      if (!enr) return notFound(res, "Запись не найдена");
      res.json(enr);
    } catch (e) { badRequest(res, e); }
  });

  // Get quiz for a course
  app.get("/api/courses/:id/quiz", requireAuth, async (req: AuthedRequest, res) => {
    const quiz = await storage.getQuiz(Number(req.params.id));
    if (!quiz) return notFound(res, "Тест не найден");
    res.json(quiz);
  });

  // Upsert quiz (HR/Admin)
  app.put("/api/courses/:id/quiz", requireAuth, async (req: AuthedRequest, res) => {
    try {
      if (!isPrivileged(req.user!)) return res.status(403).json({ error: true, message: "Нет доступа" });
      const { timeLimit, questions } = req.body;
      const quiz = await storage.upsertQuiz(Number(req.params.id), timeLimit ?? 0, JSON.stringify(questions ?? []));
      res.json(quiz);
    } catch (e) { badRequest(res, e); }
  });

  /*  Generic API 404 (must be the LAST /api handler)
     ========================= */
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: true, message: "Endpoint не найден" });
  });

  return httpServer;
}
