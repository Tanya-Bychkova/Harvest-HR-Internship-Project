from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
User = get_user_model()
@receiver(post_save, sender=User)
def auto_assign_mandatory_courses(sender, instance, created, **kwargs):
    from .models import RoleCourseRule, CourseEnrolment
    from notifications.utils import create_notification
    if not instance.is_active: return
    for rule in RoleCourseRule.objects.select_related('course').filter(course__is_published=True):
        match = False
        if rule.trigger_type=='role' and instance.role==rule.trigger_value: match=True
        elif rule.trigger_type=='department':
            if getattr(getattr(instance,'department',None),'name',None)==rule.trigger_value: match=True
        elif rule.trigger_type=='position':
            if getattr(instance,'position',None)==rule.trigger_value: match=True
        if not match: continue
        if CourseEnrolment.objects.filter(user=instance,course=rule.course).exists(): continue
        deadline = timezone.now().date()+timedelta(days=rule.deadline_days)
        CourseEnrolment.objects.create(user=instance,course=rule.course,lane_source='role_trigger',deadline=deadline,status='not_started')
        create_notification(recipient=instance,title='Новый обязательный курс',
            message=f'Вам назначен обязательный курс: {rule.course.title}',
            notification_type='learning',object_id=rule.course.id)
