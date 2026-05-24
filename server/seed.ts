import { storage, db } from "./storage";
import { roles as rolesTable } from "@shared/schema";
import { hashPassword } from "./auth";

/**
 * Seed the database with demo data. Idempotent — only runs if there
 * are no users. Demo accounts (logins on /login screen):
 *   admin@harvest.kz / admin123          (admin)
 *   hr@harvest.kz    / hr123             (HR)
 *   manager@harvest.kz / manager123      (manager)
 *   employee@harvest.kz / employee123    (employee)
 */
export async function seedDatabase() {
  // Ensure the `roles` reference table is populated (idempotent).
  // We do this before short-circuiting on existing users so that
  // freshly initialized databases always have the role catalog.
  const ROLE_CATALOG: { code: string; name: string }[] = [
    { code: "employee", name: "Сотрудник" },
    { code: "hr", name: "HR" },
    { code: "manager", name: "Руководитель" },
    { code: "admin", name: "Администратор" },
  ];
  const existingRoles = db.select().from(rolesTable).all();
  const haveCodes = new Set(existingRoles.map((r) => r.code));
  for (const r of ROLE_CATALOG) {
    if (!haveCodes.has(r.code)) {
      db.insert(rolesTable).values(r).run();
    }
  }

  const existing = await storage.listUsers({});
  if (existing.length > 0) return;

  const departments = [
    { name: "HR-отдел", city: "Астана" },
    { name: "IT-отдел", city: "Астана" },
    { name: "Финансовый отдел", city: "Алматы" },
    { name: "Маркетинг", city: "Алматы" },
    { name: "Агрономия", city: "Костанай" },
    { name: "Логистика", city: "Павлодар" },
  ];
  const deptMap = new Map<string, number>();
  for (const d of departments) {
    const row = await storage.createDepartment(d);
    deptMap.set(d.name, row.id);
  }

  const positions = ["HR-директор", "HR-менеджер", "Руководитель отдела", "Специалист", "Агроном", "Бухгалтер", "Системный администратор"];
  const posMap = new Map<string, number>();
  for (const p of positions) {
    const row = await storage.createPosition({ name: p });
    posMap.set(p, row.id);
  }

  const ts = new Date().toISOString().slice(0, 10);
  const admin = await storage.createUser({
    email: "admin@harvest.kz",
    password: hashPassword("admin123"),
    firstName: "Алия",
    lastName: "Жумабаева",
    middleName: null,
    phone: "8 701 000 0001",
    city: "Астана",
    departmentId: deptMap.get("IT-отдел")!,
    positionId: posMap.get("Системный администратор")!,
    roleCode: "admin",
    status: "active",
    dateJoined: ts,
    note: "Главный администратор системы",
  } as any);

  const hr = await storage.createUser({
    email: "hr@harvest.kz",
    password: hashPassword("hr123"),
    firstName: "Жансая",
    lastName: "Акылова",
    middleName: null,
    phone: "8 701 234 5678",
    city: "Астана",
    departmentId: deptMap.get("HR-отдел")!,
    positionId: posMap.get("HR-менеджер")!,
    roleCode: "hr",
    status: "active",
    dateJoined: ts,
    note: null,
  } as any);

  const manager = await storage.createUser({
    email: "manager@harvest.kz",
    password: hashPassword("manager123"),
    firstName: "Бауыржан",
    lastName: "Касымов",
    middleName: null,
    phone: "8 701 222 3344",
    city: "Костанай",
    departmentId: deptMap.get("Агрономия")!,
    positionId: posMap.get("Руководитель отдела")!,
    roleCode: "manager",
    status: "active",
    dateJoined: ts,
    note: null,
  } as any);

  const employee = await storage.createUser({
    email: "employee@harvest.kz",
    password: hashPassword("employee123"),
    firstName: "Айгерим",
    lastName: "Серикбаева",
    middleName: null,
    phone: "8 701 555 6677",
    city: "Костанай",
    departmentId: deptMap.get("Агрономия")!,
    positionId: posMap.get("Агроном")!,
    roleCode: "employee",
    status: "new",
    dateJoined: ts,
    note: "Новый сотрудник, проходит адаптацию",
  } as any);

  // Two more employees
  await storage.createUser({
    email: "alex@harvest.kz",
    password: hashPassword("password123"),
    firstName: "Александр",
    lastName: "Петров",
    middleName: null,
    phone: "8 701 100 0001",
    city: "Алматы",
    departmentId: deptMap.get("Маркетинг")!,
    positionId: posMap.get("Специалист")!,
    roleCode: "employee",
    status: "active",
    dateJoined: ts,
    note: null,
  } as any);
  await storage.createUser({
    email: "dina@harvest.kz",
    password: hashPassword("password123"),
    firstName: "Динара",
    lastName: "Тлеуова",
    middleName: null,
    phone: "8 701 100 0002",
    city: "Астана",
    departmentId: deptMap.get("Финансовый отдел")!,
    positionId: posMap.get("Бухгалтер")!,
    roleCode: "employee",
    status: "active",
    dateJoined: ts,
    note: null,
  } as any);

  // Tasks
  await storage.createTask({
    title: "Заполнить личную карточку сотрудника",
    description: "Зайти в раздел «Мой профиль» и заполнить недостающие поля.",
    creatorId: hr.id,
    assigneeId: employee.id,
    departmentId: employee.departmentId,
    deadline: new Date(Date.now() + 3 * 86400_000).toISOString().slice(0, 10),
    status: "new",
    priority: "high",
    filePath: null,
  } as any);

  await storage.createTask({
    title: "Подготовить отчёт по урожаю Q2",
    description: "Сводный отчёт по урожаю за второй квартал.",
    creatorId: manager.id,
    assigneeId: employee.id,
    departmentId: employee.departmentId,
    deadline: new Date(Date.now() + 10 * 86400_000).toISOString().slice(0, 10),
    status: "in_progress",
    priority: "medium",
    filePath: null,
  } as any);

  await storage.createTask({
    title: "Провести вводный инструктаж",
    description: "Провести вводный инструктаж для новых сотрудников.",
    creatorId: hr.id,
    assigneeId: manager.id,
    departmentId: manager.departmentId,
    deadline: new Date(Date.now() + 5 * 86400_000).toISOString().slice(0, 10),
    status: "new",
    priority: "medium",
    filePath: null,
  } as any);

  // Documents
  const doc1 = await storage.createDocument({
    title: "Положение о внутреннем распорядке",
    description: "Документ обязателен для ознакомления всеми сотрудниками",
    category: "Регламенты",
    filePath: "/files/internal-policy.pdf",
    uploadedBy: hr.id,
    isConfirmationRequired: true,
  } as any);
  await storage.assignDocument({ documentId: doc1.id, userId: employee.id, assignedBy: hr.id, status: "assigned" } as any);
  await storage.assignDocument({ documentId: doc1.id, userId: manager.id, assignedBy: hr.id, status: "assigned" } as any);

  await storage.createDocument({
    title: "Памятка по охране труда",
    description: "Памятка для всех новых сотрудников Harvest Agro Holding",
    category: "Охрана труда",
    filePath: "/files/safety.pdf",
    uploadedBy: hr.id,
    isConfirmationRequired: false,
  } as any);

  // Knowledge base
  await storage.createKnowledgeArticle({
    title: "Как оформить отпуск",
    category: "HR",
    body: "Чтобы оформить отпуск, подайте заявление в HR-отдел не позднее чем за 14 дней до начала отпуска. Заявление можно отправить через раздел «Обращения в HR».",
    keywords: "отпуск, заявление, отдых, hr",
    attachmentUrl: null,
    authorId: hr.id,
  } as any);
  await storage.createKnowledgeArticle({
    title: "Командировочные расходы",
    category: "Финансы",
    body: "Для возмещения командировочных расходов сохраняйте все чеки и квитанции. Заполните авансовый отчёт в течение 3 дней после возвращения.",
    keywords: "командировка, расходы, отчёт, финансы",
    attachmentUrl: null,
    authorId: hr.id,
  } as any);
  await storage.createKnowledgeArticle({
    title: "Адаптация нового сотрудника",
    category: "Адаптация",
    body: "Программа адаптации длится 30 дней и включает обучение, знакомство с командой и закрепление наставника.",
    keywords: "адаптация, новый сотрудник, наставник",
    attachmentUrl: null,
    authorId: hr.id,
  } as any);

  // Survey
  const survey = await storage.createSurvey({
    title: "Опрос вовлечённости сотрудников",
    description: "Помогите нам сделать рабочую среду лучше",
    createdBy: hr.id,
    audience: "all",
    deadline: new Date(Date.now() + 14 * 86400_000).toISOString().slice(0, 10),
    status: "active",
  } as any);
  await storage.addSurveyQuestion({
    surveyId: survey.id,
    text: "Насколько вы удовлетворены работой в компании?",
    type: "single",
    options: JSON.stringify(["Полностью удовлетворён", "Скорее удовлетворён", "Нейтрально", "Скорее не удовлетворён", "Не удовлетворён"]),
    position: 0,
  } as any);
  await storage.addSurveyQuestion({
    surveyId: survey.id,
    text: "Что бы вы хотели улучшить?",
    type: "text",
    options: null,
    position: 1,
  } as any);

  // HR request
  const req1 = await storage.createHrRequest({
    userId: employee.id,
    category: "Отпуск",
    subject: "Вопрос по отпуску",
    message: "Когда я смогу взять отпуск после окончания адаптации?",
  } as any);
  await storage.addHrRequestComment({
    requestId: req1.id,
    authorId: hr.id,
    message: "Здравствуйте! Подавать заявление можно после прохождения испытательного срока (3 месяца).",
  } as any);

  // Events
  await storage.createEvent({
    title: "Корпоратив Harvest Agro",
    description: "Ежегодное собрание сотрудников холдинга",
    startsAt: new Date(Date.now() + 21 * 86400_000).toISOString(),
    endsAt: null,
    location: "Астана, отель Rixos",
    link: null,
    createdBy: hr.id,
  } as any);
  await storage.createEvent({
    title: "Тренинг по охране труда",
    description: "Обязательный для всех сотрудников отдела агрономии",
    startsAt: new Date(Date.now() + 7 * 86400_000).toISOString(),
    endsAt: null,
    location: "Костанай, главный офис",
    link: null,
    createdBy: hr.id,
  } as any);

  // Onboarding track + assign to new employee
  const track = await storage.createOnboardingTrack({
    title: "Стандартная адаптация (30 дней)",
    description: "Базовая программа для новых сотрудников",
    createdBy: hr.id,
  } as any);
  const steps = [
    { title: "Подписать договор", dueDays: 1 },
    { title: "Получить корпоративную почту", dueDays: 2 },
    { title: "Пройти инструктаж по охране труда", dueDays: 3 },
    { title: "Познакомиться с командой", dueDays: 5 },
    { title: "Изучить базу знаний", dueDays: 10 },
    { title: "Закрепить наставника", dueDays: 14 },
    { title: "Промежуточная встреча с руководителем", dueDays: 21 },
    { title: "Итоговая встреча и обратная связь", dueDays: 30 },
  ];
  for (let i = 0; i < steps.length; i++) {
    await storage.addOnboardingStep({
      trackId: track.id,
      title: steps[i].title,
      description: null,
      dueDays: steps[i].dueDays,
      position: i,
    } as any);
  }
  await storage.assignTrackToUser(employee.id, track.id);

  // Notifications
  await storage.createNotification({
    userId: employee.id,
    title: "Добро пожаловать в Harvest HR!",
    message: "Заполните свой профиль и пройдите шаги адаптации.",
    type: "info",
    link: "/onboarding",
  } as any);
  await storage.createNotification({
    userId: employee.id,
    title: "Назначен документ",
    message: "Ознакомьтесь с «Положением о внутреннем распорядке»",
    type: "document",
    link: "/documents",
  } as any);

  console.log("[seed] Demo data created. Logins: admin@harvest.kz/admin123, hr@harvest.kz/hr123, manager@harvest.kz/manager123, employee@harvest.kz/employee123");
  await seedCourses();
}

export async function seedCourses(): Promise<void> {
  const existing = await storage.listCourses();
  if (existing.length > 0) return;

  // Get admin user as creator
  const admin = await storage.getUserByEmail("admin@harvest.kz");
  const creatorId = admin?.id ?? 1;

  const coursesData = [
    {
      title: "Техника безопасности на объектах",
      description: "Обязательный курс для всех сотрудников. Правила ТБ на агро-объектах и элеваторах.",
      category: "Безопасность",
      lane: "mandatory",
      duration: 30,
      passScore: 70,
      published: true,
      lessons: JSON.stringify([
        { id: 101, title: "Общие правила безопасности", type: "text", content: "<h3>Основные правила</h3><p>Каждый сотрудник обязан использовать СИЗ при нахождении на производственном объекте.</p><ul><li>Каска и защитный жилет обязательны в зоне элеватора</li><li>Запрещено входить в опасные зоны без сопровождения</li><li>При нарушениях немедленно сообщите руководителю</li></ul>" },
        { id: 102, title: "Действия при пожаре", type: "text", content: "<h3>При обнаружении пожара</h3><p>1. Сообщите о пожаре по тел. <strong>101</strong> и руководству.</p><p>2. Не тушите крупный огонь самостоятельно.</p><p>3. Эвакуируйтесь по ближайшему аварийному выходу.</p>" },
        { id: 103, title: "Первая помощь", type: "text", content: "<h3>Базовые навыки</h3><p>Аптечки расположены у каждого входа. При травме вызовите скорую: <strong>103</strong></p>" },
      ]),
      createdBy: creatorId,
    },
    {
      title: "Добро пожаловать в Harvest",
      description: "Вводный курс для новых сотрудников: история, структура, ценности Harvest Agro Holding.",
      category: "Онбординг",
      lane: "mandatory",
      duration: 20,
      passScore: 0,
      published: true,
      lessons: JSON.stringify([
        { id: 201, title: "История и миссия", type: "text", content: "<h3>О компании</h3><p>Harvest Agro Holding — ведущий агрохолдинг Казахстана, основан в 2008 году. Объединяет 19 аффилированных ТОО.</p><p><strong>Миссия:</strong> Обеспечить продовольственную безопасность Казахстана через устойчивое агропроизводство.</p>" },
        { id: 202, title: "Структура холдинга", type: "text", content: "<h3>Основные направления</h3><ul><li><strong>Агро-дочки</strong> — зерновые в 10 регионах</li><li><strong>Элеваторы</strong> — хранение и переработка</li><li><strong>Арена</strong> — спорт и гостиничный бизнес</li></ul>" },
        { id: 203, title: "Корпоративные ценности", type: "text", content: "<h3>Наши ценности</h3><ul><li><strong>Честность</strong></li><li><strong>Результативность</strong></li><li><strong>Командная работа</strong></li><li><strong>Развитие</strong></li></ul>" },
      ]),
      createdBy: creatorId,
    },
    {
      title: "Agile и управление задачами",
      description: "Введение в методологии Agile, Scrum и Kanban для эффективного управления проектами.",
      category: "Менеджмент",
      lane: "self_directed",
      duration: 60,
      passScore: 0,
      published: true,
      lessons: JSON.stringify([
        { id: 301, title: "Что такое Agile?", type: "text", content: "<h3>Agile Manifesto</h3><p>Agile — набор принципов гибкого управления, основанных на итерациях и командной работе.</p><ul><li>Люди важнее процессов</li><li>Работающий продукт важнее документации</li><li>Сотрудничество с клиентом важнее договора</li></ul>" },
        { id: 302, title: "Kanban на практике", type: "text", content: "<h3>Доска Kanban</h3><p>Kanban — визуальный метод управления задачами. Колонки: <strong>Бэклог → В работе → Готово</strong>.</p>" },
        { id: 303, title: "Scrum: спринты и ретро", type: "text", content: "<h3>Scrum-спринт</h3><p>Спринт — итерация работы длиной 1–4 недели. Включает планирование, стендап, ретро и демо.</p>" },
      ]),
      createdBy: creatorId,
    },
    {
      title: "Эффективная коммуникация",
      description: "Навыки деловой переписки, обратной связи и конструктивного общения.",
      category: "Soft Skills",
      lane: "self_directed",
      duration: 40,
      passScore: 0,
      published: true,
      lessons: JSON.stringify([
        { id: 401, title: "Деловая переписка", type: "text", content: "<h3>Правила деловой переписки</h3><ul><li>Чёткая тема письма</li><li>Краткость и структура</li><li>Уважительный тон</li><li>Конкретный призыв к действию</li></ul>" },
        { id: 402, title: "Обратная связь (SBI)", type: "text", content: "<h3>Модель SBI</h3><p><strong>S</strong>ituation — опишите ситуацию<br><strong>B</strong>ehavior — опишите поведение<br><strong>I</strong>mpact — опишите влияние</p>" },
      ]),
      createdBy: creatorId,
    },
    {
      title: "Excel для HR",
      description: "Практический курс по Excel: функции, сводные таблицы, работа с данными сотрудников.",
      category: "IT и цифровые навыки",
      lane: "hr_assigned",
      duration: 45,
      passScore: 60,
      published: true,
      lessons: JSON.stringify([
        { id: 501, title: "Базовые функции Excel", type: "text", content: "<h3>Ключевые функции</h3><ul><li>СУММ, СРЗНАЧ, СЧЁТ</li><li>ВПР/ГПР для поиска данных</li><li>Условное форматирование</li><li>Сводные таблицы</li></ul>" },
        { id: 502, title: "Данные сотрудников в Excel", type: "text", content: "<h3>Организация данных</h3><p>Структура таблиц, фильтры, сортировка, поиск дубликатов — всё что нужно HR для ежедневной работы.</p>" },
      ]),
      createdBy: creatorId,
    },
  ];

  for (const c of coursesData) {
    await storage.createCourse(c as any);
  }

  // Auto-enroll all users in mandatory courses
  const allUsers = await storage.listUsers();
  const allCourses = await storage.listCourses();
  const mandatoryCourses = allCourses.filter((c) => c.lane === "mandatory");
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 14);
  const deadlineStr = deadline.toISOString().split("T")[0];

  for (const user of allUsers) {
    for (const course of mandatoryCourses) {
      await storage.enroll(user.id, course.id, "mandatory", deadlineStr);
    }
  }

  console.log("[seed] Learning courses seeded.");
}
