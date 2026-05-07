"""
Management command to seed the database with test users and sample data.

Usage:
    python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the database with test users, departments, and sample data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')
        self._create_departments()
        self._create_positions()
        self._create_users()
        self.stdout.write(self.style.SUCCESS('Seeding complete!'))
        self.stdout.write('')
        self.stdout.write('Test accounts:')
        self.stdout.write('  Admin:    admin@hr.local      / Admin1234!')
        self.stdout.write('  HR:       hr@hr.local         / Hr1234!')
        self.stdout.write('  Manager:  manager@hr.local    / Manager1234!')
        self.stdout.write('  Employee: employee@hr.local   / Employee1234!')

    def _create_departments(self):
        from users.models import Department
        departments = [
            'IT-отдел', 'HR-отдел', 'Бухгалтерия', 'Маркетинг', 'Продажи',
        ]
        for name in departments:
            Department.objects.get_or_create(name=name)
        self.stdout.write(f'  Created {len(departments)} departments')

    def _create_positions(self):
        from users.models import Position
        positions = [
            'Разработчик', 'HR-специалист', 'Руководитель отдела',
            'Бухгалтер', 'Маркетолог', 'Менеджер по продажам',
        ]
        for name in positions:
            Position.objects.get_or_create(name=name)
        self.stdout.write(f'  Created {len(positions)} positions')

    def _create_users(self):
        from users.models import Department, Position

        it_dept = Department.objects.filter(name='IT-отдел').first()
        hr_dept = Department.objects.filter(name='HR-отдел').first()

        users_data = [
            {
                'email': 'admin@hr.local',
                'password': 'Admin1234!',
                'first_name': 'Администратор',
                'last_name': 'Системный',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
            },
            {
                'email': 'hr@hr.local',
                'password': 'Hr1234!',
                'first_name': 'Айгерим',
                'last_name': 'Касымова',
                'role': 'hr',
                'department': hr_dept,
            },
            {
                'email': 'manager@hr.local',
                'password': 'Manager1234!',
                'first_name': 'Дмитрий',
                'last_name': 'Петров',
                'role': 'manager',
                'department': it_dept,
            },
            {
                'email': 'employee@hr.local',
                'password': 'Employee1234!',
                'first_name': 'Нурлан',
                'last_name': 'Сейтханов',
                'role': 'employee',
                'department': it_dept,
            },
        ]

        for data in users_data:
            password = data.pop('password')
            email = data['email']
            if not User.objects.filter(email=email).exists():
                User.objects.create_user(password=password, **data)
                self.stdout.write(f'  Created user: {email}')
            else:
                self.stdout.write(f'  Skipped (exists): {email}')
