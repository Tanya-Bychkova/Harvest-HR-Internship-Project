from django.db import models
from django.conf import settings


class Event(models.Model):
    class EventType(models.TextChoices):
        CORPORATE = 'corporate', 'Корпоративное'
        TRAINING = 'training', 'Обучение'
        DEADLINE = 'deadline', 'Дедлайн'
        MEETING = 'meeting', 'Встреча'
        OTHER = 'other', 'Прочее'

    title = models.CharField(max_length=300, verbose_name='Название')
    description = models.TextField(blank=True, verbose_name='Описание')
    event_type = models.CharField(
        max_length=20, choices=EventType.choices, default=EventType.OTHER
    )
    start_date = models.DateTimeField(verbose_name='Начало')
    end_date = models.DateTimeField(null=True, blank=True, verbose_name='Конец')
    location = models.CharField(max_length=300, blank=True, verbose_name='Место / ссылка')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='created_events', verbose_name='Создал'
    )
    # null target = visible to everyone
    target_departments = models.ManyToManyField(
        'users.Department', blank=True,
        related_name='events', verbose_name='Целевые отделы'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Событие'
        verbose_name_plural = 'События'
        ordering = ['start_date']

    def __str__(self):
        return self.title
