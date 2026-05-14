from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from learning.models import CourseEnrolment
from notifications.utils import create_notification
User = get_user_model()
class Command(BaseCommand):
    help = 'Mark overdue enrolments and notify'
    def handle(self, *args, **options):
        today = timezone.now().date()
        qs = CourseEnrolment.objects.filter(deadline__lt=today,status__in=('not_started','in_progress')).select_related('user','course')
        updated = 0
        for e in qs:
            e.status='overdue'; e.save(update_fields=['status']); updated+=1
            days = (today-e.deadline).days
            create_notification(recipient=e.user,title='Курс просрочен',
                message=f'Курс «{e.course.title}» просрочен на {days} дн.',notification_type='learning',object_id=e.course.id)
        for hr in User.objects.filter(role='hr',is_active=True):
            create_notification(recipient=hr,title='Сводка просрочек',
                message=f'Сегодня просрочено: {updated}.',notification_type='learning')
        self.stdout.write(self.style.SUCCESS(f'Updated {updated} overdue enrolments.'))
