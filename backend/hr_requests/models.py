from django.db import models
from django.conf import settings


class HRRequest(models.Model):
    class Status(models.TextChoices):
        OPEN = 'open', 'Открыто'
        IN_PROGRESS = 'in_progress', 'В работе'
        CLOSED = 'closed', 'Закрыто'

    class Category(models.TextChoices):
        VACATION = 'vacation', 'Отпуск'
        SALARY = 'salary', 'Зарплата'
        DOCUMENT = 'document', 'Документы'
        GENERAL = 'general', 'Общее'
        OTHER = 'other', 'Прочее'

    subject = models.CharField(max_length=300, verbose_name='Тема')
    category = models.CharField(
        max_length=30, choices=Category.choices, default=Category.GENERAL
    )
    text = models.TextField(verbose_name='Текст обращения')
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.OPEN
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='hr_requests', verbose_name='Автор'
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='assigned_hr_requests', verbose_name='Ответственный HR'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Обращение в HR'
        verbose_name_plural = 'Обращения в HR'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.subject} ({self.author})'


class HRRequestComment(models.Model):
    request = models.ForeignKey(
        HRRequest, on_delete=models.CASCADE, related_name='comments'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE
    )
    text = models.TextField(verbose_name='Текст комментария')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Комментарий к обращению'
        ordering = ['created_at']

    def __str__(self):
        return f'Comment by {self.author} on {self.request}'
