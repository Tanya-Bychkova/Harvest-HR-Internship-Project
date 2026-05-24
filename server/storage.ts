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
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { and, desc, eq, like, or, sql } from "drizzle-orm";

const DB_PATH = process.env.DATABASE_PATH || "data.db";
const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

/**
 * Run pragma + schema bootstrap. Uses CREATE TABLE IF NOT EXISTS so
 * we don't need drizzle-kit at runtime. Keep this in sync with shared/schema.ts.
 */
export function initSchema() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      city TEXT
    );

    CREATE TABLE IF NOT EXISTS positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      middle_name TEXT,
      phone TEXT,
      city TEXT,
      department_id INTEGER,
      position_id INTEGER,
      role_code TEXT NOT NULL DEFAULT 'employee',
      status TEXT NOT NULL DEFAULT 'active',
      date_joined TEXT,
      note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      creator_id INTEGER NOT NULL,
      assignee_id INTEGER,
      department_id INTEGER,
      deadline TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      priority TEXT NOT NULL DEFAULT 'medium',
      file_path TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      file_path TEXT,
      uploaded_by INTEGER NOT NULL,
      is_confirmation_required INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS document_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      assigned_by INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'assigned',
      viewed_at TEXT,
      confirmed_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS knowledge_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT,
      body TEXT NOT NULL,
      keywords TEXT,
      attachment_url TEXT,
      author_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS surveys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      created_by INTEGER NOT NULL,
      audience TEXT NOT NULL DEFAULT 'all',
      deadline TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS survey_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      survey_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'single',
      options TEXT,
      position INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS survey_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      survey_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      answer TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hr_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category TEXT NOT NULL DEFAULT 'other',
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      closed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS hr_request_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL,
      author_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      starts_at TEXT NOT NULL,
      ends_at TEXT,
      location TEXT,
      link TEXT,
      created_by INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS onboarding_tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      created_by INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS onboarding_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      track_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      due_days INTEGER DEFAULT 7,
      position INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_onboarding_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      track_id INTEGER NOT NULL,
      step_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      completed_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      link TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'Общее',
      lane TEXT NOT NULL DEFAULT 'self_directed',
      duration INTEGER NOT NULL DEFAULT 30,
      pass_score INTEGER NOT NULL DEFAULT 0,
      published INTEGER NOT NULL DEFAULT 1,
      lessons TEXT NOT NULL DEFAULT '[]',
      created_by INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS course_enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      lane TEXT NOT NULL DEFAULT 'self_directed',
      status TEXT NOT NULL DEFAULT 'not_started',
      progress INTEGER NOT NULL DEFAULT 0,
      completed_lessons TEXT NOT NULL DEFAULT '[]',
      deadline TEXT,
      completed_at TEXT,
      cert_number TEXT,
      quiz_passed INTEGER NOT NULL DEFAULT 0,
      quiz_score INTEGER,
      enrolled_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS course_quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL UNIQUE,
      time_limit INTEGER NOT NULL DEFAULT 0,
      questions TEXT NOT NULL DEFAULT '[]'
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
    CREATE INDEX IF NOT EXISTS idx_docassign_user ON document_assignments(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_hrreq_user ON hr_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_enrollments_user ON course_enrollments(user_id);
    CREATE INDEX IF NOT EXISTS idx_enrollments_course ON course_enrollments(course_id);
  `);
}

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
    return db.select().from(departments).all();
  }
  async createDepartment(d: InsertDepartment) {
    return db.insert(departments).values(d).returning().get();
  }
  async listPositions() {
    return db.select().from(positions).all();
  }
  async createPosition(p: InsertPosition) {
    return db.insert(positions).values(p).returning().get();
  }

  // Users
  async getUser(id: number) {
    return db.select().from(users).where(eq(users.id, id)).get();
  }
  async getUserByEmail(email: string) {
    return db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
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
    return query.all();
  }
  async createUser(user: InsertUser) {
    const ts = now();
    return db
      .insert(users)
      .values({ ...user, email: user.email.toLowerCase(), createdAt: ts, updatedAt: ts } as any)
      .returning()
      .get();
  }
  async updateUser(id: number, patch: Partial<InsertUser>) {
    const ts = now();
    return db
      .update(users)
      .set({ ...patch, updatedAt: ts } as any)
      .where(eq(users.id, id))
      .returning()
      .get();
  }
  async deleteUser(id: number) {
    const r = db.delete(users).where(eq(users.id, id)).run();
    return r.changes > 0;
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
    return q.orderBy(desc(tasks.createdAt)).all();
  }
  async getTask(id: number) {
    return db.select().from(tasks).where(eq(tasks.id, id)).get();
  }
  async createTask(t: InsertTask) {
    const ts = now();
    return db
      .insert(tasks)
      .values({ ...t, createdAt: ts, updatedAt: ts } as any)
      .returning()
      .get();
  }
  async updateTask(id: number, patch: Partial<InsertTask>) {
    const ts = now();
    return db
      .update(tasks)
      .set({ ...patch, updatedAt: ts } as any)
      .where(eq(tasks.id, id))
      .returning()
      .get();
  }
  async completeTask(id: number) {
    const ts = now();
    return db
      .update(tasks)
      .set({ status: "done", completedAt: ts, updatedAt: ts } as any)
      .where(eq(tasks.id, id))
      .returning()
      .get();
  }
  async deleteTask(id: number) {
    return db.delete(tasks).where(eq(tasks.id, id)).run().changes > 0;
  }

  // Documents
  async listDocuments() {
    return db.select().from(documents).orderBy(desc(documents.createdAt)).all();
  }
  async getDocument(id: number) {
    return db.select().from(documents).where(eq(documents.id, id)).get();
  }
  async createDocument(d: InsertDocument) {
    const ts = now();
    return db
      .insert(documents)
      .values({ ...d, createdAt: ts, updatedAt: ts } as any)
      .returning()
      .get();
  }
  async updateDocument(id: number, patch: Partial<InsertDocument>) {
    const ts = now();
    return db
      .update(documents)
      .set({ ...patch, updatedAt: ts } as any)
      .where(eq(documents.id, id))
      .returning()
      .get();
  }
  async deleteDocument(id: number) {
    db.delete(documentAssignments).where(eq(documentAssignments.documentId, id)).run();
    return db.delete(documents).where(eq(documents.id, id)).run().changes > 0;
  }

  // Document assignments
  async listDocumentAssignmentsForUser(userId: number) {
    return db.select().from(documentAssignments).where(eq(documentAssignments.userId, userId)).all();
  }
  async listDocumentAssignmentsForDoc(documentId: number) {
    return db.select().from(documentAssignments).where(eq(documentAssignments.documentId, documentId)).all();
  }
  async assignDocument(a: InsertDocumentAssignment) {
    const existing = db
      .select()
      .from(documentAssignments)
      .where(and(eq(documentAssignments.documentId, a.documentId), eq(documentAssignments.userId, a.userId)))
      .get();
    if (existing) return existing;
    return db
      .insert(documentAssignments)
      .values({ ...a, createdAt: now() } as any)
      .returning()
      .get();
  }
  async markDocumentViewed(assignmentId: number) {
    return db
      .update(documentAssignments)
      .set({ status: "viewed", viewedAt: now() } as any)
      .where(eq(documentAssignments.id, assignmentId))
      .returning()
      .get();
  }
  async confirmDocument(assignmentId: number) {
    return db
      .update(documentAssignments)
      .set({ status: "confirmed", confirmedAt: now() } as any)
      .where(eq(documentAssignments.id, assignmentId))
      .returning()
      .get();
  }

  // Knowledge
  async listKnowledgeArticles(q?: string) {
    if (q) {
      const like1 = `%${q}%`;
      return db
        .select()
        .from(knowledgeArticles)
        .where(or(like(knowledgeArticles.title, like1), like(knowledgeArticles.keywords, like1), like(knowledgeArticles.body, like1)) as any)
        .orderBy(desc(knowledgeArticles.createdAt))
        .all();
    }
    return db.select().from(knowledgeArticles).orderBy(desc(knowledgeArticles.createdAt)).all();
  }
  async getKnowledgeArticle(id: number) {
    return db.select().from(knowledgeArticles).where(eq(knowledgeArticles.id, id)).get();
  }
  async createKnowledgeArticle(a: InsertKnowledgeArticle) {
    const ts = now();
    return db
      .insert(knowledgeArticles)
      .values({ ...a, createdAt: ts, updatedAt: ts } as any)
      .returning()
      .get();
  }
  async updateKnowledgeArticle(id: number, patch: Partial<InsertKnowledgeArticle>) {
    return db
      .update(knowledgeArticles)
      .set({ ...patch, updatedAt: now() } as any)
      .where(eq(knowledgeArticles.id, id))
      .returning()
      .get();
  }
  async deleteKnowledgeArticle(id: number) {
    return db.delete(knowledgeArticles).where(eq(knowledgeArticles.id, id)).run().changes > 0;
  }

  // Surveys
  async listSurveys() {
    return db.select().from(surveys).orderBy(desc(surveys.createdAt)).all();
  }
  async getSurvey(id: number) {
    return db.select().from(surveys).where(eq(surveys.id, id)).get();
  }
  async createSurvey(s: InsertSurvey) {
    const ts = now();
    return db
      .insert(surveys)
      .values({ ...s, createdAt: ts, updatedAt: ts } as any)
      .returning()
      .get();
  }
  async deleteSurvey(id: number) {
    db.delete(surveyQuestions).where(eq(surveyQuestions.surveyId, id)).run();
    db.delete(surveyAnswers).where(eq(surveyAnswers.surveyId, id)).run();
    return db.delete(surveys).where(eq(surveys.id, id)).run().changes > 0;
  }
  async listSurveyQuestions(surveyId: number) {
    return db.select().from(surveyQuestions).where(eq(surveyQuestions.surveyId, surveyId)).all();
  }
  async addSurveyQuestion(q: InsertSurveyQuestion) {
    return db.insert(surveyQuestions).values(q as any).returning().get();
  }
  async submitSurveyAnswers(surveyId: number, userId: number, answers: { questionId: number; answer: string }[]) {
    const ts = now();
    const insertOne = db.insert(surveyAnswers).values({
      surveyId,
      questionId: sql.placeholder("questionId") as any,
      userId,
      answer: sql.placeholder("answer") as any,
      createdAt: ts,
    } as any);
    for (const a of answers) {
      db.insert(surveyAnswers)
        .values({ surveyId, questionId: a.questionId, userId, answer: a.answer, createdAt: ts } as any)
        .run();
    }
  }
  async listSurveyAnswers(surveyId: number) {
    return db.select().from(surveyAnswers).where(eq(surveyAnswers.surveyId, surveyId)).all();
  }
  async hasUserAnswered(surveyId: number, userId: number) {
    const row = db
      .select()
      .from(surveyAnswers)
      .where(and(eq(surveyAnswers.surveyId, surveyId), eq(surveyAnswers.userId, userId)))
      .get();
    return !!row;
  }

  // HR requests
  async listHrRequests(filters: { userId?: number } = {}) {
    const q = filters.userId
      ? db.select().from(hrRequests).where(eq(hrRequests.userId, filters.userId))
      : db.select().from(hrRequests);
    return q.orderBy(desc(hrRequests.createdAt)).all();
  }
  async getHrRequest(id: number) {
    return db.select().from(hrRequests).where(eq(hrRequests.id, id)).get();
  }
  async createHrRequest(r: InsertHrRequest) {
    const ts = now();
    return db
      .insert(hrRequests)
      .values({ ...r, status: "open", createdAt: ts, updatedAt: ts } as any)
      .returning()
      .get();
  }
  async closeHrRequest(id: number) {
    const ts = now();
    return db
      .update(hrRequests)
      .set({ status: "closed", closedAt: ts, updatedAt: ts } as any)
      .where(eq(hrRequests.id, id))
      .returning()
      .get();
  }
  async listHrRequestComments(requestId: number) {
    return db
      .select()
      .from(hrRequestComments)
      .where(eq(hrRequestComments.requestId, requestId))
      .orderBy(hrRequestComments.createdAt)
      .all();
  }
  async addHrRequestComment(c: InsertHrRequestComment) {
    const out = db
      .insert(hrRequestComments)
      .values({ ...c, createdAt: now() } as any)
      .returning()
      .get();
    db.update(hrRequests)
      .set({ status: "in_progress", updatedAt: now() } as any)
      .where(and(eq(hrRequests.id, c.requestId), eq(hrRequests.status, "open")))
      .run();
    return out;
  }

  // Events
  async listEvents() {
    return db.select().from(events).orderBy(events.startsAt).all();
  }
  async createEvent(e: InsertEvent) {
    return db
      .insert(events)
      .values({ ...e, createdAt: now() } as any)
      .returning()
      .get();
  }
  async updateEvent(id: number, patch: Partial<InsertEvent>) {
    return db.update(events).set(patch as any).where(eq(events.id, id)).returning().get();
  }
  async deleteEvent(id: number) {
    return db.delete(events).where(eq(events.id, id)).run().changes > 0;
  }

  // Onboarding
  async listOnboardingTracks() {
    return db.select().from(onboardingTracks).all();
  }
  async createOnboardingTrack(t: InsertOnboardingTrack) {
    return db
      .insert(onboardingTracks)
      .values({ ...t, createdAt: now() } as any)
      .returning()
      .get();
  }
  async listOnboardingSteps(trackId: number) {
    return db
      .select()
      .from(onboardingSteps)
      .where(eq(onboardingSteps.trackId, trackId))
      .orderBy(onboardingSteps.position)
      .all();
  }
  async addOnboardingStep(s: InsertOnboardingStep) {
    return db.insert(onboardingSteps).values(s as any).returning().get();
  }
  async getUserOnboardingProgress(userId: number) {
    return db
      .select()
      .from(userOnboardingProgress)
      .where(eq(userOnboardingProgress.userId, userId))
      .all();
  }
  async assignTrackToUser(userId: number, trackId: number) {
    const steps = await this.listOnboardingSteps(trackId);
    const ts = now();
    for (const s of steps) {
      const existing = db
        .select()
        .from(userOnboardingProgress)
        .where(
          and(
            eq(userOnboardingProgress.userId, userId),
            eq(userOnboardingProgress.stepId, s.id),
          ),
        )
        .get();
      if (!existing) {
        db.insert(userOnboardingProgress)
          .values({ userId, trackId, stepId: s.id, status: "pending", createdAt: ts } as any)
          .run();
      }
    }
  }
  async setStepStatus(progressId: number, status: "pending" | "done") {
    const completedAt = status === "done" ? now() : null;
    return db
      .update(userOnboardingProgress)
      .set({ status, completedAt } as any)
      .where(eq(userOnboardingProgress.id, progressId))
      .returning()
      .get();
  }

  // Notifications
  async listNotifications(userId: number) {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .all();
  }
  async createNotification(n: InsertNotification) {
    return db
      .insert(notifications)
      .values({ ...n, createdAt: now() } as any)
      .returning()
      .get();
  }
  async markNotificationRead(id: number) {
    return db
      .update(notifications)
      .set({ isRead: true } as any)
      .where(eq(notifications.id, id))
      .returning()
      .get();
  }
  async markAllNotificationsRead(userId: number) {
    db.update(notifications)
      .set({ isRead: true } as any)
      .where(eq(notifications.userId, userId))
      .run();
  }

  // ── Courses / Learning ──────────────────────────────────────────
  async listCourses() {
    return db.select().from(courses).orderBy(desc(courses.createdAt)).all() as Course[];
  }
  async getCourse(id: number) {
    return db.select().from(courses).where(eq(courses.id, id)).get() as Course | undefined;
  }
  async createCourse(c: InsertCourse) {
    return db.insert(courses).values({ ...c, createdAt: now(), updatedAt: now() } as any).returning().get() as Course;
  }
  async updateCourse(id: number, patch: Partial<InsertCourse>) {
    return db.update(courses).set({ ...patch, updatedAt: now() } as any).where(eq(courses.id, id)).returning().get() as Course | undefined;
  }
  async deleteCourse(id: number) {
    db.delete(courseEnrollments).where(eq(courseEnrollments.courseId, id)).run();
    db.delete(courseQuizzes).where(eq(courseQuizzes.courseId, id)).run();
    const r = db.delete(courses).where(eq(courses.id, id)).run();
    return r.changes > 0;
  }
  async listEnrollmentsForUser(userId: number) {
    return db.select().from(courseEnrollments).where(eq(courseEnrollments.userId, userId)).all() as CourseEnrollment[];
  }
  async listEnrollmentsForCourse(courseId: number) {
    return db.select().from(courseEnrollments).where(eq(courseEnrollments.courseId, courseId)).all() as CourseEnrollment[];
  }
  async getEnrollment(userId: number, courseId: number) {
    return db.select().from(courseEnrollments)
      .where(and(eq(courseEnrollments.userId, userId), eq(courseEnrollments.courseId, courseId)))
      .get() as CourseEnrollment | undefined;
  }
  async enroll(userId: number, courseId: number, lane: string, deadline?: string | null) {
    const existing = await this.getEnrollment(userId, courseId);
    if (existing) return existing;
    return db.insert(courseEnrollments).values({
      courseId, userId, lane, status: "not_started", progress: 0,
      completedLessons: "[]", deadline: deadline ?? null,
      completedAt: null, certNumber: null, quizPassed: false, quizScore: null,
      enrolledAt: now(),
    } as any).returning().get() as CourseEnrollment;
  }
  async updateEnrollment(id: number, patch: Partial<CourseEnrollment>) {
    return db.update(courseEnrollments).set(patch as any).where(eq(courseEnrollments.id, id)).returning().get() as CourseEnrollment | undefined;
  }
  async getQuiz(courseId: number) {
    return db.select().from(courseQuizzes).where(eq(courseQuizzes.courseId, courseId)).get() as CourseQuiz | undefined;
  }
  async upsertQuiz(courseId: number, timeLimit: number, questions: string) {
    const existing = await this.getQuiz(courseId);
    if (existing) {
      return db.update(courseQuizzes).set({ timeLimit, questions } as any).where(eq(courseQuizzes.courseId, courseId)).returning().get() as CourseQuiz;
    }
    return db.insert(courseQuizzes).values({ courseId, timeLimit, questions } as any).returning().get() as CourseQuiz;
  }
}

// Initialise schema on import
initSchema();

export const storage = new DatabaseStorage();
