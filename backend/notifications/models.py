from django.db import models
from django.conf import settings


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        TASK = 'task', 'Задача'
        DOCUMENT = 'document', 'Документ'
        SURVEY = 'survey', 'Опрос'
        HR_REQUEST = 'hr_request', 'Обращение в HR'
        EVENT = 'event', 'Событие'
        ONBOARDING = 'onboarding', 'Адаптация'
        LEARNING = 'learning', 'Обучение'
        SYSTEM = 'system', 'Система'
        GENERAL = 'general', 'Общее'

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='notifications', verbose_name='Получатель',
    )
    title = models.CharField(max_length=300, verbose_name='Заголовок')
    message = models.TextField(verbose_name='Сообщение')
    notification_type = models.CharField(
        max_length=30, choices=NotificationType.choices, default=NotificationType.SYSTEM,
    )
    object_id = models.PositiveIntegerField(null=True, blank=True, verbose_name='ID объекта')
    is_read = models.BooleanField(default=False, verbose_name='Прочитано')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Уведомление'
        verbose_name_plural = 'Уведомления'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.recipient} — {self.title}'
