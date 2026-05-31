import {
  users,
  departments,
  positions,
  roles,
  tasks,
  documents,
  documentAssignments,
  knowledgeArticles,
  surveys,
  surveyQuestions,
  surveyAnswers,
  hrRequests,
  hrRequestComments,
  events,
  onboardingTracks,
  onboardingSteps,
  userOnboardingProgress,
  notifications,
  courses,
  courseEnrollments,
  courseQuizzes,
} from "@shared/schema";
import type {
  User,
  InsertUser,
  Department,
  InsertDepartment,
  Position,
  InsertPosition,
  Task,
  InsertTask,
  Document,
  InsertDocument,
  DocumentAssignment,
  InsertDocumentAssignment,
  KnowledgeArticle,
  InsertKnowledgeArticle,
  Survey,
  InsertSurvey,
  SurveyQuestion,
  InsertSurveyQuestion,
  SurveyAnswer,
  InsertSurveyAnswer,
  HrRequest,
  InsertHrRequest,
  HrRequestComment,
  InsertHrRequestComment,
  Event,
  InsertEvent,
  OnboardingTrack,
  InsertOnboardingTrack,
  OnboardingStep,
  InsertOnboardingStep,
  UserOnboardingProgress,
  Notification,
  InsertNotification,
  SafeUser,
  Course,
  InsertCourse,
  CourseEnrollment,
  CourseQuiz,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool);

function now(): string {
  return new Date().toISOString();
}

export function stripPassword<T extends { password?: string }>(u: T): SafeUser {
  const { password, ...safe } = u as unknown as User;
  return safe as SafeUser;
}

/* ============================================================
   IStorage interface
   ============================================================ */

export interface IStorage {
  // Departments / positions / roles
  listDepartments(): Promise<Department[]>;
  createDepartment(d: InsertDepartment): Promise<Department>;
  listPositions(): Promise<Position[]>;
  createPosition(p: InsertPosition): Promise<Position>;

  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  listUsers(filters?: { departmentId?: number; status?: string; q?: string; city?: string }): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, patch: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Tasks
  listTasks(filters?: { assigneeId?: number; creatorId?: number; departmentId?: number; status?: string }): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(t: InsertTask): Promise<Task>;
  updateTask(id: number, patch: Partial<InsertTask>): Promise<Task | undefined>;
  completeTask(id: number): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;

  // Documents
  listDocuments(): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(d: InsertDocument): Promise<Document>;
  updateDocument(id: number, patch: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;

  // Document assignments
  listDocumentAssignmentsForUser(userId: number): Promise<DocumentAssignment[]>;
  listDocumentAssignmentsForDoc(documentId: number): Promise<DocumentAssignment[]>;
  assignDocument(a: InsertDocumentAssignment): Promise<DocumentAssignment>;
  markDocumentViewed(assignmentId: number): Promise<DocumentAssignment | undefined>;
  confirmDocument(assignmentId: number): Promise<DocumentAssignment | undefined>;

  // Knowledge
  listKnowledgeArticles(q?: string): Promise<KnowledgeArticle[]>;
  getKnowledgeArticle(id: number): Promise<KnowledgeArticle | undefined>;
  createKnowledgeArticle(a: InsertKnowledgeArticle): Promise<KnowledgeArticle>;
  updateKnowledgeArticle(id: number, patch: Partial<InsertKnowledgeArticle>): Promise<KnowledgeArticle | undefined>;
  deleteKnowledgeArticle(id: number): Promise<boolean>;

  // Surveys
  listSurveys(): Promise<Survey[]>;
  getSurvey(id: number): Promise<Survey | undefined>;
  createSurvey(s: InsertSurvey): Promise<Survey>;
  deleteSurvey(id: number): Promise<boolean>;
  listSurveyQuestions(surveyId: number): Promise<SurveyQuestion[]>;
  addSurveyQuestion(q: InsertSurveyQuestion): Promise<SurveyQuestion>;
  submitSurveyAnswers(surveyId: number, userId: number, answers: { questionId: number; answer: string }[]): Promise<void>;
  listSurveyAnswers(surveyId: number): Promise<SurveyAnswer[]>;
  hasUserAnswered(surveyId: number, userId: number): Promise<boolean>;

  // HR requests
  listHrRequests(filters?: { userId?: number }): Promise<HrRequest[]>;
  getHrRequest(id: number): Promise<HrRequest | undefined>;
  createHrRequest(r: InsertHrRequest): Promise<HrRequest>;
  closeHrRequest(id: number): Promise<HrRequest | undefined>;
  listHrRequestComments(requestId: number): Promise<HrRequestComment[]>;
  addHrRequestComment(c: InsertHrRequestComment): Promise<HrRequestComment>;

  // Events
  listEvents(): Promise<Event[]>;
  createEvent(e: InsertEvent): Promise<Event>;
  updateEvent(id: number, patch: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;

  // Onboarding
  listOnboardingTracks(): Promise<OnboardingTrack[]>;
  createOnboardingTrack(t: InsertOnboardingTrack): Promise<OnboardingTrack>;
  listOnboardingSteps(trackId: number): Promise<OnboardingStep[]>;
  addOnboardingStep(s: InsertOnboardingStep): Promise<OnboardingStep>;
  getUserOnboardingProgress(userId: number): Promise<UserOnboardingProgress[]>;
  assignTrackToUser(userId: number, trackId: number): Promise<void>;
  setStepStatus(progressId: number, status: "pending" | "done"): Promise<UserOnboardingProgress | undefined>;

  // Notifications
  listNotifications(userId: number): Promise<Notification[]>;
  createNotification(n: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsRead(userId: number): Promise<void>;

  // Courses / Learning
  listCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(c: InsertCourse): Promise<Course>;
  updateCourse(id: number, patch: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;
  listEnrollmentsForUser(userId: number): Promise<CourseEnrollment[]>;
  listEnrollmentsForCourse(courseId: number): Promise<CourseEnrollment[]>;
  getEnrollment(userId: number, courseId: number): Promise<CourseEnrollment | undefined>;
  enroll(userId: number, courseId: number, lane: string, deadline?: string | null): Promise<CourseEnrollment>;
  updateEnrollment(id: number, patch: Partial<CourseEnrollment>): Promise<CourseEnrollment | undefined>;
  getQuiz(courseId: number): Promise<CourseQuiz | undefined>;
  upsertQuiz(courseId: number, timeLimit: number, questions: string): Promise<CourseQuiz>;
}

export class DatabaseStorage implements IStorage {
  // Departments
  async listDepartments() {
    return db.select().from(departments);
  }
  async createDepartment(d: InsertDepartment) {
    const rows = await db.insert(departments).values(d).returning();
    return rows[0];
  }
  async listPositions() {
    return db.select().from(positions);
  }
  async createPosition(p: InsertPosition) {
    const rows = await db.insert(positions).values(p).returning();
    return rows[0];
  }

  // Users
  async getUser(id: number) {
    const rows = await db.select().from(users).where(eq(users.id, id));
    return rows[0];
  }
  async getUserByEmail(email: string) {
    const rows = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return rows[0];
  }
  async listUsers(filters: { departmentId?: number; status?: string; q?: string; city?: string } = {}) {
    const conds = [] as any[];
    if (filters.departmentId) conds.push(eq(users.departmentId, filters.departmentId));
    if (filters.status) conds.push(eq(users.status, filters.status));
    if (filters.city) conds.push(eq(users.city, filters.city));
    if (filters.q) {
      const like1 = `%${filters.q}%`;
      conds.push(
        or(
          like(users.firstName, like1),
          like(users.lastName, like1),
          like(users.email, like1),
          like(users.middleName, like1),
        ) as any,
      );
    }
    const query = conds.length ? db.select().from(users).where(and(...conds)) : db.select().from(users);
    return query;
  }
  async createUser(user: InsertUser) {
    const ts = now();
    const rows = await db
      .insert(users)
      .values({ ...user, email: user.email.toLowerCase(), createdAt: ts, updatedAt: ts } as any)
      .returning();
    return rows[0];
  }
  async updateUser(id: number, patch: Partial<InsertUser>) {
    const ts = now();
    const rows = await db
      .update(users)
      .set({ ...patch, updatedAt: ts } as any)
      .where(eq(users.id, id))
      .returning();
    return rows[0];
  }
  async deleteUser(id: number) {
    const rows = await db.delete(users).where(eq(users.id, id)).returning();
    return rows.length > 0;
  }

  // Tasks
  async listTasks(filters: { assigneeId?: number; creatorId?: number; departmentId?: number; status?: string } = {}) {
    const conds = [] as any[];
    if (filters.assigneeId) conds.push(eq(tasks.assigneeId, filters.assigneeId));
    if (filters.creatorId) conds.push(eq(tasks.creatorId, filters.creatorId));
    if (filters.departmentId) conds.push(eq(tasks.departmentId, filters.departmentId));
    if (filters.status) conds.push(eq(tasks.status, filters.status));
    const q = conds.length
      ? db.select().from(tasks).where(and(...conds))
      : db.select().from(tasks);
    return q.orderBy(desc(tasks.createdAt));
  }
  async getTask(id: number) {
    const rows = await db.select().from(tasks).where(eq(tasks.id, id));
    return rows[0];
  }
  async createTask(t: InsertTask) {
    const ts = now();
    const rows = await db
      .insert(tasks)
      .values({ ...t, createdAt: ts, updatedAt: ts } as any)
      .returning();
    return rows[0];
  }
  async updateTask(id: number, patch: Partial<InsertTask>) {
    const ts = now();
    const rows = await db
      .update(tasks)
      .set({ ...patch, updatedAt: ts } as any)
      .where(eq(tasks.id, id))
      .returning();
    return rows[0];
  }
  async completeTask(id: number) {
    const ts = now();
    const rows = await db
      .update(tasks)
      .set({ status: "done", completedAt: ts, updatedAt: ts } as any)
      .where(eq(tasks.id, id))
      .returning();
    return rows[0];
  }
  async deleteTask(id: number) {
    const rows = await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return rows.length > 0;
  }

  // Documents
  async listDocuments() {
    return db.select().from(documents).orderBy(desc(documents.createdAt));
  }
  async getDocument(id: number) {
    const rows = await db.select().from(documents).where(eq(documents.id, id));
    return rows[0];
  }
  async createDocument(d: InsertDocument) {
    const ts = now();
    const rows = await db
      .insert(documents)
      .values({ ...d, createdAt: ts, updatedAt: ts } as any)
      .returning();
    return rows[0];
  }
  async updateDocument(id: number, patch: Partial<InsertDocument>) {
    const ts = now();
    const rows = await db
      .update(documents)
      .set({ ...patch, updatedAt: ts } as any)
      .where(eq(documents.id, id))
      .returning();
    return rows[0];
  }
  async deleteDocument(id: number) {
    await db.delete(documentAssignments).where(eq(documentAssignments.documentId, id));
    const rows = await db.delete(documents).where(eq(documents.id, id)).returning();
    return rows.length > 0;
  }

  // Document assignments
  async listDocumentAssignmentsForUser(userId: number) {
    return db.select().from(documentAssignments).where(eq(documentAssignments.userId, userId));
  }
  async listDocumentAssignmentsForDoc(documentId: number) {
    return db.select().from(documentAssignments).where(eq(documentAssignments.documentId, documentId));
  }
  async assignDocument(a: InsertDocumentAssignment) {
    const existing = await db
      .select()
      .from(documentAssignments)
      .where(and(eq(documentAssignments.documentId, a.documentId), eq(documentAssignments.userId, a.userId)));
    if (existing[0]) return existing[0];
    const rows = await db
      .insert(documentAssignments)
      .values({ ...a, createdAt: now() } as any)
      .returning();
    return rows[0];
  }
  async markDocumentViewed(assignmentId: number) {
    const rows = await db
      .update(documentAssignments)
      .set({ status: "viewed", viewedAt: now() } as any)
      .where(eq(documentAssignments.id, assignmentId))
      .returning();
    return rows[0];
  }
  async confirmDocument(assignmentId: number) {
    const rows = await db
      .update(documentAssignments)
      .set({ status: "confirmed", confirmedAt: now() } as any)
      .where(eq(documentAssignments.id, assignmentId))
      .returning();
    return rows[0];
  }

  // Knowledge
  async listKnowledgeArticles(q?: string) {
    if (q) {
      const like1 = `%${q}%`;
      return db
        .select()
        .from(knowledgeArticles)
        .where(or(like(knowledgeArticles.title, like1), like(knowledgeArticles.keywords, like1), like(knowledgeArticles.body, like1)) as any)
        .orderBy(desc(knowledgeArticles.createdAt));
    }
    return db.select().from(knowledgeArticles).orderBy(desc(knowledgeArticles.createdAt));
  }
  async getKnowledgeArticle(id: number) {
    const rows = await db.select().from(knowledgeArticles).where(eq(knowledgeArticles.id, id));
    return rows[0];
  }
  async createKnowledgeArticle(a: InsertKnowledgeArticle) {
    const ts = now();
    const rows = await db
      .insert(knowledgeArticles)
      .values({ ...a, createdAt: ts, updatedAt: ts } as any)
      .returning();
    return rows[0];
  }
  async updateKnowledgeArticle(id: number, patch: Partial<InsertKnowledgeArticle>) {
    const rows = await db
      .update(knowledgeArticles)
      .set({ ...patch, updatedAt: now() } as any)
      .where(eq(knowledgeArticles.id, id))
      .returning();
    return rows[0];
  }
  async deleteKnowledgeArticle(id: number) {
    const rows = await db.delete(knowledgeArticles).where(eq(knowledgeArticles.id, id)).returning();
    return rows.length > 0;
  }

  // Surveys
  async listSurveys() {
    return db.select().from(surveys).orderBy(desc(surveys.createdAt));
  }
  async getSurvey(id: number) {
    const rows = await db.select().from(surveys).where(eq(surveys.id, id));
    return rows[0];
  }
  async createSurvey(s: InsertSurvey) {
    const ts = now();
    const rows = await db
      .insert(surveys)
      .values({ ...s, createdAt: ts, updatedAt: ts } as any)
      .returning();
    return rows[0];
  }
  async deleteSurvey(id: number) {
    await db.delete(surveyQuestions).where(eq(surveyQuestions.surveyId, id));
    await db.delete(surveyAnswers).where(eq(surveyAnswers.surveyId, id));
    const rows = await db.delete(surveys).where(eq(surveys.id, id)).returning();
    return rows.length > 0;
  }
  async listSurveyQuestions(surveyId: number) {
    return db.select().from(surveyQuestions).where(eq(surveyQuestions.surveyId, surveyId));
  }
  async addSurveyQuestion(q: InsertSurveyQuestion) {
    const rows = await db.insert(surveyQuestions).values(q as any).returning();
    return rows[0];
  }
  async submitSurveyAnswers(surveyId: number, userId: number, answers: { questionId: number; answer: string }[]) {
    const ts = now();
    for (const a of answers) {
      await db
        .insert(surveyAnswers)
        .values({ surveyId, questionId: a.questionId, userId, answer: a.answer, createdAt: ts } as any);
    }
  }
  async listSurveyAnswers(surveyId: number) {
    return db.select().from(surveyAnswers).where(eq(surveyAnswers.surveyId, surveyId));
  }
  async hasUserAnswered(surveyId: number, userId: number) {
    const rows = await db
      .select()
      .from(surveyAnswers)
      .where(and(eq(surveyAnswers.surveyId, surveyId), eq(surveyAnswers.userId, userId)));
    return rows.length > 0;
  }

  // HR requests
  async listHrRequests(filters: { userId?: number } = {}) {
    const q = filters.userId
      ? db.select().from(hrRequests).where(eq(hrRequests.userId, filters.userId))
      : db.select().from(hrRequests);
    return q.orderBy(desc(hrRequests.createdAt));
  }
  async getHrRequest(id: number) {
    const rows = await db.select().from(hrRequests).where(eq(hrRequests.id, id));
    return rows[0];
  }
  async createHrRequest(r: InsertHrRequest) {
    const ts = now();
    const rows = await db
      .insert(hrRequests)
      .values({ ...r, status: "open", createdAt: ts, updatedAt: ts } as any)
      .returning();
    return rows[0];
  }
  async closeHrRequest(id: number) {
    const ts = now();
    const rows = await db
      .update(hrRequests)
      .set({ status: "closed", closedAt: ts, updatedAt: ts } as any)
      .where(eq(hrRequests.id, id))
      .returning();
    return rows[0];
  }
  async listHrRequestComments(requestId: number) {
    return db
      .select()
      .from(hrRequestComments)
      .where(eq(hrRequestComments.requestId, requestId))
      .orderBy(hrRequestComments.createdAt);
  }
  async addHrRequestComment(c: InsertHrRequestComment) {
    const rows = await db
      .insert(hrRequestComments)
      .values({ ...c, createdAt: now() } as any)
      .returning();
    await db
      .update(hrRequests)
      .set({ status: "in_progress", updatedAt: now() } as any)
      .where(and(eq(hrRequests.id, c.requestId), eq(hrRequests.status, "open")));
    return rows[0];
  }

  // Events
  async listEvents() {
    return db.select().from(events).orderBy(events.startsAt);
  }
  async createEvent(e: InsertEvent) {
    const rows = await db
      .insert(events)
      .values({ ...e, createdAt: now() } as any)
      .returning();
    return rows[0];
  }
  async updateEvent(id: number, patch: Partial<InsertEvent>) {
    const rows = await db.update(events).set(patch as any).where(eq(events.id, id)).returning();
    return rows[0];
  }
  async deleteEvent(id: number) {
    const rows = await db.delete(events).where(eq(events.id, id)).returning();
    return rows.length > 0;
  }

  // Onboarding
  async listOnboardingTracks() {
    return db.select().from(onboardingTracks);
  }
  async createOnboardingTrack(t: InsertOnboardingTrack) {
    const rows = await db
      .insert(onboardingTracks)
      .values({ ...t, createdAt: now() } as any)
      .returning();
    return rows[0];
  }
  async listOnboardingSteps(trackId: number) {
    return db
      .select()
      .from(onboardingSteps)
      .where(eq(onboardingSteps.trackId, trackId))
      .orderBy(onboardingSteps.position);
  }
  async addOnboardingStep(s: InsertOnboardingStep) {
    const rows = await db.insert(onboardingSteps).values(s as any).returning();
    return rows[0];
  }
  async getUserOnboardingProgress(userId: number) {
    return db
      .select()
      .from(userOnboardingProgress)
      .where(eq(userOnboardingProgress.userId, userId));
  }
  async assignTrackToUser(userId: number, trackId: number) {
    const steps = await this.listOnboardingSteps(trackId);
    const ts = now();
    for (const s of steps) {
      const existing = await db
        .select()
        .from(userOnboardingProgress)
        .where(
          and(
            eq(userOnboardingProgress.userId, userId),
            eq(userOnboardingProgress.stepId, s.id),
          ),
        );
      if (!existing[0]) {
        await db
          .insert(userOnboardingProgress)
          .values({ userId, trackId, stepId: s.id, status: "pending", createdAt: ts } as any);
      }
    }
  }
  async setStepStatus(progressId: number, status: "pending" | "done") {
    const completedAt = status === "done" ? now() : null;
    const rows = await db
      .update(userOnboardingProgress)
      .set({ status, completedAt } as any)
      .where(eq(userOnboardingProgress.id, progressId))
      .returning();
    return rows[0];
  }

  // Notifications
  async listNotifications(userId: number) {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }
  async createNotification(n: InsertNotification) {
    const rows = await db
      .insert(notifications)
      .values({ ...n, createdAt: now() } as any)
      .returning();
    return rows[0];
  }
  async markNotificationRead(id: number) {
    const rows = await db
      .update(notifications)
      .set({ isRead: true } as any)
      .where(eq(notifications.id, id))
      .returning();
    return rows[0];
  }
  async markAllNotificationsRead(userId: number) {
    await db
      .update(notifications)
      .set({ isRead: true } as any)
      .where(eq(notifications.userId, userId));
  }

  // ── Courses / Learning ──────────────────────────────────────────
  async listCourses() {
    return db.select().from(courses).orderBy(desc(courses.createdAt)) as Promise<Course[]>;
  }
  async getCourse(id: number) {
    const rows = await db.select().from(courses).where(eq(courses.id, id));
    return rows[0] as Course | undefined;
  }
  async createCourse(c: InsertCourse) {
    const rows = await db.insert(courses).values({ ...c, createdAt: now(), updatedAt: now() } as any).returning();
    return rows[0] as Course;
  }
  async updateCourse(id: number, patch: Partial<InsertCourse>) {
    const rows = await db.update(courses).set({ ...patch, updatedAt: now() } as any).where(eq(courses.id, id)).returning();
    return rows[0] as Course | undefined;
  }
  async deleteCourse(id: number) {
    await db.delete(courseEnrollments).where(eq(courseEnrollments.courseId, id));
    await db.delete(courseQuizzes).where(eq(courseQuizzes.courseId, id));
    const rows = await db.delete(courses).where(eq(courses.id, id)).returning();
    return rows.length > 0;
  }
  async listEnrollmentsForUser(userId: number) {
    return db.select().from(courseEnrollments).where(eq(courseEnrollments.userId, userId)) as Promise<CourseEnrollment[]>;
  }
  async listEnrollmentsForCourse(courseId: number) {
    return db.select().from(courseEnrollments).where(eq(courseEnrollments.courseId, courseId)) as Promise<CourseEnrollment[]>;
  }
  async getEnrollment(userId: number, courseId: number) {
    const rows = await db.select().from(courseEnrollments)
      .where(and(eq(courseEnrollments.userId, userId), eq(courseEnrollments.courseId, courseId)));
    return rows[0] as CourseEnrollment | undefined;
  }
  async enroll(userId: number, courseId: number, lane: string, deadline?: string | null) {
    const existing = await this.getEnrollment(userId, courseId);
    if (existing) return existing;
    const rows = await db.insert(courseEnrollments).values({
      courseId, userId, lane, status: "not_started", progress: 0,
      completedLessons: "[]", deadline: deadline ?? null,
      completedAt: null, certNumber: null, quizPassed: false, quizScore: null,
      enrolledAt: now(),
    } as any).returning();
    return rows[0] as CourseEnrollment;
  }
  async updateEnrollment(id: number, patch: Partial<CourseEnrollment>) {
    const rows = await db.update(courseEnrollments).set(patch as any).where(eq(courseEnrollments.id, id)).returning();
    return rows[0] as CourseEnrollment | undefined;
  }
  async getQuiz(courseId: number) {
    const rows = await db.select().from(courseQuizzes).where(eq(courseQuizzes.courseId, courseId));
    return rows[0] as CourseQuiz | undefined;
  }
  async upsertQuiz(courseId: number, timeLimit: number, questions: string) {
    const existing = await this.getQuiz(courseId);
    if (existing) {
      const rows = await db.update(courseQuizzes).set({ timeLimit, questions } as any).where(eq(courseQuizzes.courseId, courseId)).returning();
      return rows[0] as CourseQuiz;
    }
    const rows = await db.insert(courseQuizzes).values({ courseId, timeLimit, questions } as any).returning();
    return rows[0] as CourseQuiz;
  }
}

export const storage = new DatabaseStorage();
