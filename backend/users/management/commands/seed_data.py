"""
Management command to seed the database with all data matching harvest-v5 frontend.

Usage:
    python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, timedelta

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed database with users, departments, employees, tasks, courses matching v5 frontend'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')
        self._create_departments()
        self._create_positions()
        self._create_users()
        self._create_employees()
        self._create_tasks()
        self._create_courses()
        self._create_knowledge()
        self._create_notifications()
        self.stdout.write(self.style.SUCCESS('Seeding complete!'))
        self.stdout.write('')
        self.stdout.write('Test accounts:')
        self.stdout.write('  Admin:    admin@harvest.kz    / admin123')
        self.stdout.write('  HR:       hr@harvest.kz       / hr123')
        self.stdout.write('  Employee: user@harvest.kz     / user123')

    # ── Departments ─────────────────────────────────────────────────────────────
    def _create_departments(self):
        from users.models import Department
        depts = [
            'HR-отдел', 'IT-отдел', 'Финансовый отдел', 'Юридический отдел',
            'Маркетинг', 'Бухгалтерия', 'Операционный отдел', 'Агрономия',
            'Логистика', 'Безопасность', 'Руководство',
        ]
        for name in depts:
            Department.objects.get_or_create(name=name)
        self.stdout.write(f'  Departments: {len(depts)}')

    # ── Positions ───────────────────────────────────────────────────────────────
    def _create_positions(self):
        from users.models import Position
        positions = [
            'Директор', 'Зам директора', 'HRD', 'HR-менеджер',
            'Начальник службы безопасности', 'Директор по маркетингу',
            'Юрист', 'Главный бухгалтер', 'IT директор', 'IT-практикант',
            'Специалист по кадрам', 'Финансовый менеджер', 'Системный инженер',
            'Администратор',
        ]
        for name in positions:
            Position.objects.get_or_create(name=name)
        self.stdout.write(f'  Positions: {len(positions)}')

    # ── Auth users ──────────────────────────────────────────────────────────────
    def _create_users(self):
        from users.models import Department, Position

        hr_dept  = Department.objects.filter(name='HR-отдел').first()
        it_dept  = Department.objects.filter(name='IT-отдел').first()
        hr_pos   = Position.objects.filter(name='HR-менеджер').first()
        emp_pos  = Position.objects.filter(name='IT-практикант').first()

        users_data = [
            {
                'email': 'admin@harvest.kz',
                'password': 'admin123',
                'first_name': 'Администратор',
                'last_name': 'Системы',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
                'department': it_dept,
                'hire_date': date(2024, 1, 1),
            },
            {
                'email': 'hr@harvest.kz',
                'password': 'hr123',
                'first_name': 'Жансая',
                'last_name': 'Акылова',
                'role': 'hr',
                'department': hr_dept,
                'position': hr_pos,
                'phone': '87782342313',
                'hire_date': date(2022, 9, 19),
            },
            {
                'email': 'user@harvest.kz',
                'password': 'user123',
                'first_name': 'Данияр',
                'last_name': 'Мусин',
                'role': 'employee',
                'department': it_dept,
                'position': emp_pos,
                'phone': '87001234567',
                'hire_date': date(2026, 4, 22),
            },
        ]

        created = 0
        for data in users_data:
            password = data.pop('password')
            email = data['email']
            if not User.objects.filter(email=email).exists():
                User.objects.create_user(password=password, **data)
                created += 1
                self.stdout.write(f'  Created user: {email}')
            else:
                self.stdout.write(f'  Skipped (exists): {email}')

    # ── Employees (full org chart from v5) ──────────────────────────────────────
    def _create_employees(self):
        """
        The frontend keeps a separate hr_employees list (the org chart / directory).
        On the backend these map to User records. We create them as employee-role
        users so they appear in the directory.
        """
        from users.models import Department, Position

        def get_dept(name):
            return Department.objects.filter(name=name).first()
        def get_pos(name):
            return Position.objects.filter(name=name).first()

        employees = [
            # (email, password, first, last, role, dept, pos, phone, hire_date)
            ('d.uvashev@harvest.kz',   'Harvest2026!', 'Даулет',    'Увашев',      'manager',  'Руководство',       'Директор',                      '87017614433', date(2020,3,1)),
            ('a.maralov@harvest.kz',   'Harvest2026!', 'Алмаз',     'Маралов',     'manager',  'Руководство',       'Зам директора',                 '87717777099', date(2020,5,1)),
            ('zh.kapenova@harvest.kz', 'Harvest2026!', 'Жанар',     'Капенова',    'hr',       'HR-отдел',          'HRD',                           '87014888333', date(2021,1,15)),
            ('g.mykan@harvest.kz',     'Harvest2026!', 'Габит',     'Мыкан',       'manager',  'Безопасность',      'Начальник службы безопасности', '87052988688', date(2021,6,1)),
            ('v.tsoy@harvest.kz',      'Harvest2026!', 'Виктория',  'Цой',         'manager',  'Маркетинг',         'Директор по маркетингу',        '87017202222', date(2022,2,1)),
            ('r.imanbaeva@harvest.kz', 'Harvest2026!', 'Райхан',    'Иманбаева',   'employee', 'Юридический отдел', 'Юрист',                         '87017490832', date(2020,8,1)),
            ('a.madvakasova@harvest.kz','Harvest2026!', 'Алия',     'Мадвакасова', 'employee', 'Бухгалтерия',       'Главный бухгалтер',             '87087712627', date(2019,5,1)),
            ('g.tulenov@harvest.kz',   'Harvest2026!', 'Гурам',     'Туленов',     'manager',  'IT-отдел',          'IT директор',                   '87012115446', date(2021,11,1)),
            ('n.muratbek@harvest.kz',  'Harvest2026!', 'Нуржан',    'Муратбек',    'employee', 'Финансовый отдел',  'Финансовый менеджер',           '87786669766', date(2023,1,15)),
            ('d.alekhin@harvest.kz',   'Harvest2026!', 'Дмитрий',   'Алехин',      'employee', 'IT-отдел',          'Системный инженер',             '87089661006', date(2025,12,31)),
        ]

        created = 0
        for email, pwd, fn, ln, role, dept_name, pos_name, phone, hd in employees:
            if not User.objects.filter(email=email).exists():
                User.objects.create_user(
                    email=email, password=pwd,
                    first_name=fn, last_name=ln,
                    role=role,
                    department=get_dept(dept_name),
                    position=get_pos(pos_name),
                    phone=phone, hire_date=hd,
                )
                created += 1
        self.stdout.write(f'  Employees created: {created}')

    # ── Tasks ───────────────────────────────────────────────────────────────────
    def _create_tasks(self):
        from tasks.models import Task

        if Task.objects.exists():
            self.stdout.write('  Tasks: skipped (already exist)')
            return

        hr_user = User.objects.filter(email='hr@harvest.kz').first()
        if not hr_user:
            return

        tasks_data = [
            ('Провести аудит систем',       '',  date(2026, 5, 5),  'in_progress', 'high'),
            ('Составить CJM сотрудника',    '',  date(2026, 5, 6),  'new',         'medium'),
            ('Бенчмарк платформ',           '',  date(2026, 5, 4),  'overdue',     'high'),
            ('Описать UX барьеры',          '',  date(2026, 5, 8),  'new',         'low'),
        ]
        for title, desc, due, status, priority in tasks_data:
            Task.objects.create(
                title=title, description=desc,
                assigned_to=hr_user, created_by=hr_user,
                status=status, priority=priority, due_date=due,
            )
        self.stdout.write(f'  Tasks created: {len(tasks_data)}')

    # ── Learning courses (from v5 seedLearning) ─────────────────────────────────
    def _create_courses(self):
        from learning.models import Course, CourseCategory, CourseLesson

        if Course.objects.exists():
            self.stdout.write('  Courses: skipped (already exist)')
            return

        admin = User.objects.filter(email='admin@harvest.kz').first()

        courses_data = [
            {
                'title': 'Техника безопасности на объектах',
                'category': 'Безопасность',
                'lane': 'mandatory',
                'description': 'Обязательный курс для всех сотрудников. Правила ТБ на агро-объектах и элеваторах.',
                'estimated_minutes': 30,
                'passing_score': 70,
                'is_published': True,
                'lessons': [
                    ('Общие правила безопасности', 'text',
                     'Каждый сотрудник обязан использовать СИЗ при нахождении на производственном объекте. Каска и защитный жилет обязательны в зоне элеватора. Запрещено входить в опасные зоны без сопровождения.'),
                    ('Действия при пожаре', 'text',
                     'При обнаружении пожара: 1. Сообщите по тел. 101 и руководству. 2. Не тушите крупный огонь самостоятельно. 3. Эвакуируйтесь по ближайшему аварийному выходу.'),
                    ('Первая помощь', 'text',
                     'Аптечки расположены у каждого входа. При травме: обеспечьте безопасность пострадавшего, вызовите скорую (103), окажите первую помощь до приезда медиков.'),
                ],
            },
            {
                'title': 'Добро пожаловать в Harvest',
                'category': 'Онбординг',
                'lane': 'mandatory',
                'description': 'Вводный курс для новых сотрудников: история, структура, ценности Harvest Agro Holding.',
                'estimated_minutes': 20,
                'passing_score': 0,
                'is_published': True,
                'lessons': [
                    ('История и миссия', 'text',
                     'Harvest Agro Holding — ведущий агрохолдинг Казахстана, основан в 2008 году. Объединяет 19 аффилированных ТОО. Миссия: обеспечить продовольственную безопасность Казахстана.'),
                    ('Структура холдинга', 'text',
                     'Основные направления: Агро-дочки (зерновые в 10 регионах), Элеваторы (хранение и переработка), Арена (спорт и гостиничный бизнес).'),
                    ('Корпоративные ценности', 'text',
                     'Наши ценности: Честность, Результативность, Командная работа, Развитие.'),
                ],
            },
            {
                'title': 'Agile и управление задачами',
                'category': 'Менеджмент',
                'lane': 'self_directed',
                'description': 'Введение в методологии Agile, Scrum и Kanban для эффективного управления проектами.',
                'estimated_minutes': 60,
                'passing_score': 0,
                'is_published': True,
                'lessons': [
                    ('Что такое Agile?', 'text',
                     'Agile — набор принципов гибкого управления, основанных на итерациях и командной работе. Манифест: люди важнее процессов, работающий продукт важнее документации.'),
                    ('Kanban на практике', 'text',
                     'Kanban — визуальный метод управления задачами. Колонки: Бэклог → В работе → Готово. Ключевые правила: ограничение WIP, визуализация потока.'),
                    ('Scrum: спринты и ретро', 'text',
                     'Спринт — итерация работы длиной 1–4 недели. Включает планирование, стендап, ретро и демо. Результат — рабочий инкремент продукта.'),
                ],
            },
            {
                'title': 'Эффективная коммуникация',
                'category': 'Soft Skills',
                'lane': 'self_directed',
                'description': 'Навыки деловой переписки, обратной связи и конструктивного общения.',
                'estimated_minutes': 40,
                'passing_score': 0,
                'is_published': True,
                'lessons': [
                    ('Деловая переписка', 'text',
                     'Правила деловой переписки: чёткая тема письма, краткость и структура, уважительный тон, конкретный призыв к действию.'),
                    ('Обратная связь (SBI)', 'text',
                     'Модель SBI: Situation — опишите ситуацию, Behavior — опишите поведение, Impact — опишите влияние. Пример: «На встрече вчера вы перебивали коллег, это снизило эффективность обсуждения.»'),
                ],
            },
            {
                'title': 'Excel для HR',
                'category': 'IT и цифровые навыки',
                'lane': 'hr_assigned',
                'description': 'Практический курс по Excel: функции, сводные таблицы, работа с данными сотрудников.',
                'estimated_minutes': 45,
                'passing_score': 60,
                'is_published': True,
                'lessons': [
                    ('Базовые функции Excel', 'text',
                     'Ключевые функции: СУММ, СРЗНАЧ, СЧЁТ; ВПР/ГПР для поиска данных; условное форматирование; сводные таблицы.'),
                    ('Данные сотрудников в Excel', 'text',
                     'Структура таблиц, фильтры, сортировка, поиск дубликатов — всё что нужно HR для ежедневной работы.'),
                ],
            },
        ]

        for cd in courses_data:
            cat, _ = CourseCategory.objects.get_or_create(name=cd['category'])
            course = Course.objects.create(
                title=cd['title'],
                description=cd['description'],
                category=cat,
                lane=cd['lane'],
                estimated_minutes=cd['estimated_minutes'],
                passing_score=cd['passing_score'],
                is_published=cd['is_published'],
                created_by=admin,
            )
            for i, (title, ctype, content) in enumerate(cd['lessons']):
                CourseLesson.objects.create(
                    course=course, title=title,
                    content_type=ctype, content_text=content, order=i,
                )

        self.stdout.write(f'  Courses created: {len(courses_data)}')

        # Auto-enrol all users in mandatory courses
        from learning.models import CourseEnrolment
        mandatory = Course.objects.filter(lane='mandatory', is_published=True)
        users = User.objects.filter(is_active=True)
        enrolled = 0
        for user in users:
            for course in mandatory:
                deadline = timezone.now().date() + timedelta(days=14)
                _, created = CourseEnrolment.objects.get_or_create(
                    user=user, course=course,
                    defaults={'lane_source': 'role_trigger', 'deadline': deadline, 'status': 'not_started'},
                )
                if created:
                    enrolled += 1
        self.stdout.write(f'  Mandatory enrolments created: {enrolled}')

    # ── Knowledge base ──────────────────────────────────────────────────────────
    def _create_knowledge(self):
        from knowledge_base.models import KnowledgeArticle, KnowledgeCategory

        if KnowledgeArticle.objects.exists():
            self.stdout.write('  Knowledge: skipped (already exist)')
            return

        admin = User.objects.filter(email='admin@harvest.kz').first()

        articles = [
            ('HR-процессы', 'Регламент адаптации 2026',
             'Полный регламент процесса адаптации новых сотрудников в Harvest Agro Holding. Включает этапы, ответственных и чеклисты.'),
            ('HR-процессы', 'Политика отпусков',
             'Правила предоставления ежегодных и дополнительных отпусков. Порядок согласования и оформления.'),
            ('IT', 'Инструкция по VPN',
             'Как настроить корпоративный VPN для удалённой работы. Пошаговая инструкция для Windows и Mac.'),
            ('IT', 'Правила информационной безопасности',
             'Политика ИБ компании: парольная политика, работа с конфиденциальными данными, действия при инцидентах.'),
            ('Общее', 'Корпоративный кодекс',
             'Ценности, принципы и правила поведения сотрудников Harvest Agro Holding.'),
        ]

        created = 0
        for cat_name, title, content in articles:
            cat, _ = KnowledgeCategory.objects.get_or_create(name=cat_name)
            KnowledgeArticle.objects.create(
                title=title, content=content,
                category=cat, author=admin, is_published=True,
            )
            created += 1
        self.stdout.write(f'  Knowledge articles created: {created}')

    # ── Notifications ───────────────────────────────────────────────────────────
    def _create_notifications(self):
        from notifications.models import Notification

        if Notification.objects.exists():
            self.stdout.write('  Notifications: skipped (already exist)')
            return

        hr_user = User.objects.filter(email='hr@harvest.kz').first()
        emp_user = User.objects.filter(email='user@harvest.kz').first()
        if not (hr_user and emp_user):
            return

        notifs = [
            (hr_user,  'Новый документ требует подтверждения', 'Регламент адаптации 2026 — необходимо ознакомиться', 'document'),
            (hr_user,  'Назначена новая задача', 'Провести аудит систем — дедлайн 05.05.2026', 'task'),
            (emp_user, 'Новый опрос вовлечённости', 'Пройдите опрос до 10.05.2026', 'survey'),
            (emp_user, 'Событие: Встреча всей команды', '15.05.2026 в 10:00 — офис Астана', 'event'),
        ]
        for recipient, title, message, ntype in notifs:
            Notification.objects.create(
                recipient=recipient, title=title,
                message=message, notification_type=ntype,
            )
        self.stdout.write(f'  Notifications created: {len(notifs)}')
