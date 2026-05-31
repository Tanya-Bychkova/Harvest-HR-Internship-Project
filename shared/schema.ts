import { pgTable, text, integer, serial, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/* ============================================================
   Reference / dictionary tables
   ============================================================ */

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  city: text("city"),
});

export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

// roles: employee | hr | manager | admin
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // "employee" | "hr" | "manager" | "admin"
  name: text("name").notNull(),
});

/* ============================================================
   Users
   ============================================================ */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // hashed
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  middleName: text("middle_name"),
  phone: text("phone"),
  city: text("city"),
  departmentId: integer("department_id"),
  positionId: integer("position_id"),
  roleCode: text("role_code").notNull().default("employee"),
  status: text("status").notNull().default("active"), // active | new | fired
  dateJoined: text("date_joined"), // ISO yyyy-mm-dd
  note: text("note"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/* ============================================================
   Tasks
   ============================================================ */

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  creatorId: integer("creator_id").notNull(),
  assigneeId: integer("assignee_id"),
  departmentId: integer("department_id"),
  deadline: text("deadline"),
  status: text("status").notNull().default("new"), // new | in_progress | done | overdue
  priority: text("priority").notNull().default("medium"), // high | medium | low
  filePath: text("file_path"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  completedAt: text("completed_at"),
});

/* ============================================================
   Documents
   ============================================================ */

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  filePath: text("file_path"),
  uploadedBy: integer("uploaded_by").notNull(),
  isConfirmationRequired: boolean("is_confirmation_required").notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const documentAssignments = pgTable("document_assignments", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  userId: integer("user_id").notNull(),
  assignedBy: integer("assigned_by").notNull(),
  status: text("status").notNull().default("assigned"), // assigned | viewed | confirmed
  viewedAt: text("viewed_at"),
  confirmedAt: text("confirmed_at"),
  createdAt: text("created_at").notNull(),
});

/* ============================================================
   Knowledge base
   ============================================================ */

export const knowledgeArticles = pgTable("knowledge_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category"),
  body: text("body").notNull(),
  keywords: text("keywords"), // comma-separated
  attachmentUrl: text("attachment_url"),
  authorId: integer("author_id").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/* ============================================================
   Surveys
   ============================================================ */

export const surveys = pgTable("surveys", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  createdBy: integer("created_by").notNull(),
  audience: text("audience").notNull().default("all"), // all | department:<id> | users:<csv>
  deadline: text("deadline"),
  status: text("status").notNull().default("active"), // draft | active | closed
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const surveyQuestions = pgTable("survey_questions", {
  id: serial("id").primaryKey(),
  surveyId: integer("survey_id").notNull(),
  text: text("text").notNull(),
  type: text("type").notNull().default("single"), // single | multi | text
  options: text("options"), // JSON array
  position: integer("position").notNull().default(0),
});

export const surveyAnswers = pgTable("survey_answers", {
  id: serial("id").primaryKey(),
  surveyId: integer("survey_id").notNull(),
  questionId: integer("question_id").notNull(),
  userId: integer("user_id").notNull(),
  answer: text("answer").notNull(), // text or JSON for options
  createdAt: text("created_at").notNull(),
});

/* ============================================================
   HR requests
   ============================================================ */

export const hrRequests = pgTable("hr_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  category: text("category").notNull().default("other"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("open"), // open | in_progress | closed
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  closedAt: text("closed_at"),
});

export const hrRequestComments = pgTable("hr_request_comments", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull(),
  authorId: integer("author_id").notNull(),
  message: text("message").notNull(),
  createdAt: text("created_at").notNull(),
});

/* ============================================================
   Events / calendar
   ============================================================ */

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startsAt: text("starts_at").notNull(),
  endsAt: text("ends_at"),
  location: text("location"),
  link: text("link"),
  createdBy: integer("created_by").notNull(),
  createdAt: text("created_at").notNull(),
});

/* ============================================================
   Onboarding
   ============================================================ */

export const onboardingTracks = pgTable("onboarding_tracks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  createdBy: integer("created_by").notNull(),
  createdAt: text("created_at").notNull(),
});

export const onboardingSteps = pgTable("onboarding_steps", {
  id: serial("id").primaryKey(),
  trackId: integer("track_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueDays: integer("due_days").default(7), // days after assignment
  position: integer("position").notNull().default(0),
});

export const userOnboardingProgress = pgTable("user_onboarding_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  trackId: integer("track_id").notNull(),
  stepId: integer("step_id").notNull(),
  status: text("status").notNull().default("pending"), // pending | done
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull(),
});

/* ============================================================
   Notifications
   ============================================================ */

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"), // task | document | survey | event | hr | info
  link: text("link"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: text("created_at").notNull(),
});

/* ============================================================
   Insert schemas (Zod) + types
   ============================================================ */

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true });
export const insertPositionSchema = createInsertSchema(positions).omit({ id: true });

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentAssignmentSchema = createInsertSchema(documentAssignments).omit({
  id: true,
  createdAt: true,
  viewedAt: true,
  confirmedAt: true,
});

export const insertKnowledgeArticleSchema = createInsertSchema(knowledgeArticles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSurveySchema = createInsertSchema(surveys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSurveyQuestionSchema = createInsertSchema(surveyQuestions).omit({ id: true });
export const insertSurveyAnswerSchema = createInsertSchema(surveyAnswers).omit({
  id: true,
  createdAt: true,
});

export const insertHrRequestSchema = createInsertSchema(hrRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  closedAt: true,
  status: true,
});

export const insertHrRequestCommentSchema = createInsertSchema(hrRequestComments).omit({
  id: true,
  createdAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

export const insertOnboardingTrackSchema = createInsertSchema(onboardingTracks).omit({
  id: true,
  createdAt: true,
});

export const insertOnboardingStepSchema = createInsertSchema(onboardingSteps).omit({ id: true });

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  isRead: true,
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Registration schema
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  middleName: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
});

/* ============================================================
   Types
   ============================================================ */

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SafeUser = Omit<User, "password">;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type Position = typeof positions.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type DocumentAssignment = typeof documentAssignments.$inferSelect;
export type InsertDocumentAssignment = z.infer<typeof insertDocumentAssignmentSchema>;

export type KnowledgeArticle = typeof knowledgeArticles.$inferSelect;
export type InsertKnowledgeArticle = z.infer<typeof insertKnowledgeArticleSchema>;

export type Survey = typeof surveys.$inferSelect;
export type InsertSurvey = z.infer<typeof insertSurveySchema>;

export type SurveyQuestion = typeof surveyQuestions.$inferSelect;
export type InsertSurveyQuestion = z.infer<typeof insertSurveyQuestionSchema>;

export type SurveyAnswer = typeof surveyAnswers.$inferSelect;
export type InsertSurveyAnswer = z.infer<typeof insertSurveyAnswerSchema>;

export type HrRequest = typeof hrRequests.$inferSelect;
export type InsertHrRequest = z.infer<typeof insertHrRequestSchema>;

export type HrRequestComment = typeof hrRequestComments.$inferSelect;
export type InsertHrRequestComment = z.infer<typeof insertHrRequestCommentSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type OnboardingTrack = typeof onboardingTracks.$inferSelect;
export type InsertOnboardingTrack = z.infer<typeof insertOnboardingTrackSchema>;

export type OnboardingStep = typeof onboardingSteps.$inferSelect;
export type InsertOnboardingStep = z.infer<typeof insertOnboardingStepSchema>;

export type UserOnboardingProgress = typeof userOnboardingProgress.$inferSelect;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

/* ============================================================
   Learning / Courses
   ============================================================ */

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("Общее"),
  lane: text("lane").notNull().default("self_directed"), // mandatory | hr_assigned | self_directed
  duration: integer("duration").notNull().default(30), // minutes
  passScore: integer("pass_score").notNull().default(0), // 0 = no test required
  published: boolean("published").notNull().default(true),
  lessons: text("lessons").notNull().default("[]"), // JSON: [{id, title, type, content, url}]
  createdBy: integer("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const courseEnrollments = pgTable("course_enrollments", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  userId: integer("user_id").notNull(),
  lane: text("lane").notNull().default("self_directed"),
  status: text("status").notNull().default("not_started"), // not_started | in_progress | completed
  progress: integer("progress").notNull().default(0), // 0–100
  completedLessons: text("completed_lessons").notNull().default("[]"), // JSON int[]
  deadline: text("deadline"),
  completedAt: text("completed_at"),
  certNumber: text("cert_number"),
  quizPassed: boolean("quiz_passed").notNull().default(false),
  quizScore: integer("quiz_score"),
  enrolledAt: text("enrolled_at").notNull(),
});

export const courseQuizzes = pgTable("course_quizzes", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().unique(),
  timeLimit: integer("time_limit").notNull().default(0), // minutes, 0 = unlimited
  questions: text("questions").notNull().default("[]"), // JSON [{id, text, options[], correct_options[]}]
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCourseEnrollmentSchema = createInsertSchema(courseEnrollments).omit({
  id: true,
  enrolledAt: true,
});

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type CourseQuiz = typeof courseQuizzes.$inferSelect;
