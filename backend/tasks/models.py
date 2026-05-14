from django.db import models
from django.conf import settings


class Task(models.Model):
    class Status(models.TextChoices):
        NEW = 'new', 'Новая'
        IN_PROGRESS = 'in_progress', 'В работе'
        DONE = 'done', 'Выполнена'
        OVERDUE = 'overdue', 'Просрочена'

    class Priority(models.TextChoices):
        LOW = 'low', 'Низкий'
        MEDIUM = 'medium', 'Средний'
        HIGH = 'high', 'Высокий'

    title = models.CharField(max_length=300, verbose_name='Название')
    description = models.TextField(blank=True, verbose_name='Описание')
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='tasks', verbose_name='Исполнитель'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='created_tasks', verbose_name='Создал'
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.NEW, verbose_name='Статус'
    )
    priority = models.CharField(
        max_length=20, choices=Priority.choices, default=Priority.MEDIUM, verbose_name='Приоритет'
    )
    due_date = models.DateField(null=True, blank=True, verbose_name='Срок')
    file = models.FileField(upload_to='tasks/', null=True, blank=True, verbose_name='Файл')
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Задача'
        verbose_name_plural = 'Задачи'
        ordering = ['-created_at']

    def __str__(self):
        return self.title
